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
  ZITF_DELAY_IMPACT_LABEL,
  ZITF_RISK_MITIGATION_OPTIONS,
  ZITF_SPEND_BAND_LABEL,
  ZITF_SPEND_BANDS,
  ZITF_TABLES,
  computeIsPriorityFollowup,
  type ZitfDelayImpact,
  type ZitfPaperFormInput,
  type ZitfRiskMitigationOption,
  type ZitfSpendBand,
} from "@/types/zitf";

type PaperResponseFormProps = {
  currentUserId: string;
};

type FormState = {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stand_number: string;
  monthly_supplier_spend_band: "" | ZitfSpendBand;
  crossborder_supplier_exposure: "" | "yes" | "no";
  crossborder_delay_impact: "" | ZitfDelayImpact;
  paid_first_time_risk_mitigation: ZitfRiskMitigationOption[];
  crossborder_delay_pain: boolean;
  fraud_pain: boolean;
  consent_followup_contact: boolean;
  notes: string;
};

const EMPTY_FORM: FormState = {
  business_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  stand_number: "",
  monthly_supplier_spend_band: "",
  crossborder_supplier_exposure: "",
  crossborder_delay_impact: "",
  paid_first_time_risk_mitigation: [],
  crossborder_delay_pain: false,
  fraud_pain: false,
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

  function toggleRiskMitigation(option: ZitfRiskMitigationOption) {
    setForm((f) => {
      const has = f.paid_first_time_risk_mitigation.includes(option);
      return {
        ...f,
        paid_first_time_risk_mitigation: has
          ? f.paid_first_time_risk_mitigation.filter((o) => o !== option)
          : [...f.paid_first_time_risk_mitigation, option],
      };
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.business_name.trim()) next.business_name = "Required";
    if (!form.contact_name.trim()) next.contact_name = "Required";
    if (!form.stand_number.trim()) next.stand_number = "Required";
    if (form.contact_email && !/.+@.+\..+/.test(form.contact_email)) {
      next.contact_email = "Invalid email";
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
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      stand_number: form.stand_number.trim(),
      monthly_supplier_spend_band: form.monthly_supplier_spend_band || null,
      crossborder_supplier_exposure: form.crossborder_supplier_exposure === "yes",
      crossborder_delay_impact: form.crossborder_delay_impact || null,
      paid_first_time_risk_mitigation: form.paid_first_time_risk_mitigation,
      crossborder_delay_pain: form.crossborder_delay_pain,
      fraud_pain: form.fraud_pain,
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
            label="Contact name *"
            name="contact_name"
            value={form.contact_name}
            onChange={(e) => patch("contact_name", e.target.value)}
            error={errors.contact_name}
          />
          <Input
            label="Contact email"
            name="contact_email"
            type="email"
            value={form.contact_email}
            onChange={(e) => patch("contact_email", e.target.value)}
            error={errors.contact_email}
          />
          <Input
            label="Contact phone"
            name="contact_phone"
            value={form.contact_phone}
            onChange={(e) => patch("contact_phone", e.target.value)}
          />
        </div>
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
            label="Buys from cross-border suppliers"
            value={form.crossborder_supplier_exposure}
            onChange={(e) =>
              patch(
                "crossborder_supplier_exposure",
                e.target.value as FormState["crossborder_supplier_exposure"],
              )
            }
          >
            <option value="">— Not answered —</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
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
            containerClassName="md:col-span-2"
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
                    onChange={() => toggleRiskMitigation(opt)}
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
            checked={form.crossborder_delay_pain}
            onChange={(v) => patch("crossborder_delay_pain", v)}
          />
          <Checkbox
            label="Fraud pain flagged"
            checked={form.fraud_pain}
            onChange={(v) => patch("fraud_pain", v)}
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
