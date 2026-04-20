"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ops/ui/Button";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { cn } from "@/lib/ops/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ZITF_CUSTOMER_TYPES,
  ZITF_DELAY_IMPACT_LABEL,
  ZITF_PAIN_HEADACHES,
  ZITF_PAYMENT_METHODS,
  ZITF_RISK_MITIGATION_OPTIONS,
  ZITF_SECTORS,
  ZITF_SPEND_BAND_LABEL,
  ZITF_SPEND_BANDS,
  ZITF_SUPPLIER_LOCATIONS,
  ZITF_TABLES,
  ZITF_TEAM_SIZE_BANDS,
  computeIsPriorityFollowup,
  type ZitfDelayImpact,
  type ZitfPaperFormInput,
  type ZitfRiskMitigationOption,
  type ZitfSector,
  type ZitfSpendBand,
  type ZitfTeamSizeBand,
} from "@/types/zitf";

type PaperResponseFormProps = {
  currentUserId: string;
};

type FormState = {
  business_name: string;
  decision_maker_name: string;
  email: string;
  phone: string;
  stand_number: string;
  sector: "" | ZitfSector;
  team_size_band: "" | ZitfTeamSizeBand;
  supplier_locations: string[];
  customer_types: string[];
  pay_suppliers_methods: string[];
  receive_customers_methods: string[];
  pain_top_headaches: string[];
  monthly_supplier_spend_band: "" | ZitfSpendBand;
  crossborder_delay_impact: "" | ZitfDelayImpact;
  paid_first_time_risk_mitigation: ZitfRiskMitigationOption[];
  pain_crossborder_delay: boolean;
  pain_fraud_loss: boolean;
  consent_followup_contact: boolean;
  notes: string;
};

const EMPTY_FORM: FormState = {
  business_name: "",
  decision_maker_name: "",
  email: "",
  phone: "",
  stand_number: "",
  sector: "",
  team_size_band: "",
  supplier_locations: [],
  customer_types: [],
  pay_suppliers_methods: [],
  receive_customers_methods: [],
  pain_top_headaches: [],
  monthly_supplier_spend_band: "",
  crossborder_delay_impact: "",
  paid_first_time_risk_mitigation: [],
  pain_crossborder_delay: false,
  pain_fraud_loss: false,
  consent_followup_contact: false,
  notes: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function PaperResponseForm({
  currentUserId,
}: PaperResponseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleMulti<K extends keyof FormState>(key: K, option: string) {
    setForm((f) => {
      const current = f[key] as unknown as string[];
      const has = current.includes(option);
      const next = has
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...f, [key]: next } as FormState;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.business_name.trim()) next.business_name = "Required";
    if (!form.decision_maker_name.trim()) next.decision_maker_name = "Required";
    if (!form.stand_number.trim()) next.stand_number = "Required";
    if (form.email && !/.+@.+\..+/.test(form.email)) {
      next.email = "Invalid email";
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const payload: ZitfPaperFormInput = {
      business_name: form.business_name.trim(),
      decision_maker_name: form.decision_maker_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      stand_number: form.stand_number.trim(),
      sector: form.sector || null,
      team_size_band: form.team_size_band || null,
      supplier_locations: form.supplier_locations,
      customer_types: form.customer_types,
      pay_suppliers_methods: form.pay_suppliers_methods,
      receive_customers_methods: form.receive_customers_methods,
      pain_top_headaches: form.pain_top_headaches,
      monthly_supplier_spend_band: form.monthly_supplier_spend_band || null,
      crossborder_delay_impact: form.crossborder_delay_impact || null,
      paid_first_time_risk_mitigation: form.paid_first_time_risk_mitigation,
      pain_crossborder_delay: form.pain_crossborder_delay,
      pain_fraud_loss: form.pain_fraud_loss,
      consent_followup_contact: form.consent_followup_contact,
      notes: form.notes.trim() || null,
    };

    setSubmitting(true);
    setSubmitError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from(ZITF_TABLES.responses)
      .insert({
        ...payload,
        channel: "paper",
        collected_by: currentUserId,
      })
      .select("id, qualified_score, is_priority_followup")
      .single();

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    const priority =
      data?.is_priority_followup ??
      computeIsPriorityFollowup({
        consent_followup_contact: payload.consent_followup_contact,
        monthly_supplier_spend_band: payload.monthly_supplier_spend_band,
        paid_first_time_risk_mitigation: payload.paid_first_time_risk_mitigation,
        crossborder_delay_impact: payload.crossborder_delay_impact,
      });
    const score = data?.qualified_score;
    const flash = encodeURIComponent(
      `Saved ${payload.business_name} · score ${
        typeof score === "number" ? Math.round(score) : "?"
      }${priority ? " · priority follow-up" : ""}`,
    );
    router.push(`/indaba/zitf?flash=${flash}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Respondent"
        description="Who filled out the paper form, and which stand collected it."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Business name *"
            name="business_name"
            value={form.business_name}
            onChange={(e) => patch("business_name", e.target.value)}
            error={errors.business_name}
          />
          <Input
            label="Stand number *"
            name="stand_number"
            value={form.stand_number}
            onChange={(e) => patch("stand_number", e.target.value)}
            error={errors.stand_number}
            hint="ZITF 2026 hall / stand reference."
          />
          <Input
            label="Decision-maker name *"
            name="decision_maker_name"
            value={form.decision_maker_name}
            onChange={(e) => patch("decision_maker_name", e.target.value)}
            error={errors.decision_maker_name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => patch("email", e.target.value)}
            error={errors.email}
          />
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(e) => patch("phone", e.target.value)}
          />
        </div>
      </FormSection>

      <FormSection
        title="Business profile"
        description="Where the business sits — sector, size, and who they transact with."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Sector"
            value={form.sector}
            onChange={(e) =>
              patch("sector", e.target.value as FormState["sector"])
            }
          >
            <option value="">— Not answered —</option>
            {ZITF_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            label="Team size"
            value={form.team_size_band}
            onChange={(e) =>
              patch(
                "team_size_band",
                e.target.value as FormState["team_size_band"],
              )
            }
          >
            <option value="">— Not answered —</option>
            {ZITF_TEAM_SIZE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>

        <CheckboxGrid
          legend="Supplier locations (tick all that apply)"
          options={ZITF_SUPPLIER_LOCATIONS}
          selected={form.supplier_locations}
          onToggle={(opt) => toggleMulti("supplier_locations", opt)}
        />

        <CheckboxGrid
          legend="Customer types (tick all that apply)"
          options={ZITF_CUSTOMER_TYPES}
          selected={form.customer_types}
          onToggle={(opt) => toggleMulti("customer_types", opt)}
        />

        <CheckboxGrid
          legend="How they pay suppliers (tick all that apply)"
          options={ZITF_PAYMENT_METHODS}
          selected={form.pay_suppliers_methods}
          onToggle={(opt) => toggleMulti("pay_suppliers_methods", opt)}
        />

        <CheckboxGrid
          legend="How they receive from customers (tick all that apply)"
          options={ZITF_PAYMENT_METHODS}
          selected={form.receive_customers_methods}
          onToggle={(opt) => toggleMulti("receive_customers_methods", opt)}
        />

        <CheckboxGrid
          legend="Top headaches (tick all that apply)"
          options={ZITF_PAIN_HEADACHES}
          selected={form.pain_top_headaches}
          onToggle={(opt) => toggleMulti("pain_top_headaches", opt)}
        />
      </FormSection>

      <FormSection
        title="Signals"
        description="Key the form's scored questions exactly as the respondent marked them."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Monthly supplier spend"
            value={form.monthly_supplier_spend_band}
            onChange={(e) =>
              patch(
                "monthly_supplier_spend_band",
                e.target.value as FormState["monthly_supplier_spend_band"],
              )
            }
          >
            <option value="">— Not answered —</option>
            {ZITF_SPEND_BANDS.map((b) => (
              <option key={b} value={b}>
                {ZITF_SPEND_BAND_LABEL[b]}
              </option>
            ))}
          </Select>

          <Select
            label="Impact if cross-border payment delays 7-10 days"
            value={form.crossborder_delay_impact}
            onChange={(e) =>
              patch(
                "crossborder_delay_impact",
                e.target.value as FormState["crossborder_delay_impact"],
              )
            }
          >
            <option value="">— Not answered —</option>
            {(Object.keys(ZITF_DELAY_IMPACT_LABEL) as ZitfDelayImpact[]).map(
              (k) => (
                <option key={k} value={k}>
                  {ZITF_DELAY_IMPACT_LABEL[k]}
                </option>
              ),
            )}
          </Select>
        </div>

        <fieldset className="mt-4 space-y-2">
          <legend className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            First-time supplier risk mitigation (tick all that apply)
          </legend>
          <div className="grid gap-1.5 md:grid-cols-2">
            {ZITF_RISK_MITIGATION_OPTIONS.map((opt) => {
              const checked = form.paid_first_time_risk_mitigation.includes(opt);
              return (
                <label
                  key={opt}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 border px-3 py-2 text-[13px]",
                    checked
                      ? "border-zimx-black bg-zimx-offwhite"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleMulti("paid_first_time_risk_mitigation", opt)
                    }
                    className="h-4 w-4 border border-zinc-300 accent-zimx-green"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <Checkbox
            label="Cross-border delay pain flagged"
            checked={form.pain_crossborder_delay}
            onChange={(v) => patch("pain_crossborder_delay", v)}
          />
          <Checkbox
            label="Fraud loss pain flagged"
            checked={form.pain_fraud_loss}
            onChange={(v) => patch("pain_fraud_loss", v)}
          />
        </div>
      </FormSection>

      <FormSection
        title="Consent & notes"
        description="Required for pilot outreach. Notes capture anything Brendon picked up at the stand."
      >
        <Checkbox
          label="Consent to follow-up contact for ZimX pilot"
          checked={form.consent_followup_contact}
          onChange={(v) => patch("consent_followup_contact", v)}
        />
        <div className="mt-4">
          <Textarea
            label="Stand notes"
            hint="Verbal context, tone of voice, warm leads vs. tyre-kickers, etc."
            rows={5}
            value={form.notes}
            onChange={(e) => patch("notes", e.target.value)}
          />
        </div>
      </FormSection>

      {submitError ? (
        <div
          role="alert"
          className="border border-zimx-red/30 bg-zimx-red/5 px-4 py-3 font-mono text-[12px] uppercase tracking-tag text-zimx-red"
        >
          Save failed: {submitError}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <Button variant="ghost" size="md" href="/indaba/zitf">
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save response"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-zinc-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="font-mono text-[13px] uppercase tracking-tag text-zimx-black">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zimx-black">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 border border-zinc-300 accent-zimx-green"
      />
      {label}
    </label>
  );
}

function CheckboxGrid({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: ReadonlyArray<string>;
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <fieldset className="mt-4 space-y-2">
      <legend className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {legend}
      </legend>
      <div className="grid gap-1.5 md:grid-cols-2">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={cn(
                "flex cursor-pointer items-center gap-2 border px-3 py-2 text-[13px]",
                checked
                  ? "border-zimx-black bg-zimx-offwhite"
                  : "border-zinc-200 bg-white hover:border-zinc-300",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt)}
                className="h-4 w-4 border border-zinc-300 accent-zimx-green"
              />
              {opt}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
