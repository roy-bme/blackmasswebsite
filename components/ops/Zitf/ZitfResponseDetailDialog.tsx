"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ZITF_CHANNEL_LABEL,
  ZITF_DELAY_IMPACT_LABEL,
  ZITF_SPEND_BAND_LABEL,
  ZITF_STATUS_LABEL,
  ZITF_TABLES,
  type ZitfResponse,
  type ZitfStatus,
} from "@/types/zitf";

type ZitfResponseDetailDialogProps = {
  row: ZitfResponse | null;
  canEdit: boolean;
  onClose: () => void;
};

const STATUS_TONE: Record<ZitfStatus, PillTone> = {
  new: "info",
  qualified: "success",
  contacted: "ink",
  pilot_candidate: "warning",
  rejected: "danger",
};

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ZitfResponseDetailDialog({
  row,
  canEdit,
  onClose,
}: ZitfResponseDetailDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ZitfStatus>("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!row) return;
    setStatus(row.status);
    setNotes(row.notes ?? "");
    setError(null);
  }, [row]);

  async function handleSave() {
    if (!row) return;
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: saveError } = await supabase
      .from(ZITF_TABLES.responses)
      .update({ status, notes: notes.trim() ? notes.trim() : null })
      .eq("id", row.id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    router.refresh();
    onClose();
  }

  if (!row) {
    return (
      <Dialog open={false} onClose={onClose} size="lg" ariaLabel="Response detail">
        <div />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      size="lg"
      ariaLabel={`${row.business_name ?? "Response"} detail`}
    >
      <Dialog.Header>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog.Title className="truncate">
              {row.business_name ?? "Unnamed business"}
            </Dialog.Title>
            <Pill tone={STATUS_TONE[row.status]} size="sm">
              {ZITF_STATUS_LABEL[row.status]}
            </Pill>
            {row.is_priority_followup ? (
              <Pill tone="success" size="sm">
                Priority
              </Pill>
            ) : null}
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            {DATE_FMT.format(new Date(row.submitted_at))} &middot;{" "}
            {ZITF_CHANNEL_LABEL[row.channel]}
            {row.stand_number ? ` · Stand ${row.stand_number}` : ""}
          </p>
        </div>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>

      <Dialog.Body className="space-y-5">
        <Section title="Contact">
          <Grid>
            <Field label="Name" value={row.contact_name} />
            <Field label="Email" value={row.contact_email} />
            <Field label="Phone" value={row.contact_phone} />
            <Field
              label="Consent follow-up"
              value={row.consent_followup_contact ? "Yes" : "No"}
            />
          </Grid>
        </Section>

        <Section title="Signals">
          <Grid>
            <Field
              label="Spend band"
              value={
                row.monthly_supplier_spend_band
                  ? ZITF_SPEND_BAND_LABEL[row.monthly_supplier_spend_band]
                  : null
              }
            />
            <Field
              label="Cross-border supplier"
              value={
                row.crossborder_supplier_exposure === null
                  ? null
                  : row.crossborder_supplier_exposure
                    ? "Yes"
                    : "No"
              }
            />
            <Field
              label="Delay impact"
              value={
                row.crossborder_delay_impact
                  ? ZITF_DELAY_IMPACT_LABEL[row.crossborder_delay_impact]
                  : null
              }
            />
            <Field
              label="Score"
              value={`${Math.round(row.qualified_score)} / 100`}
            />
          </Grid>
          {row.paid_first_time_risk_mitigation &&
          row.paid_first_time_risk_mitigation.length > 0 ? (
            <div className="mt-3">
              <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                Risk mitigation
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-zimx-black">
                {row.paid_first_time_risk_mitigation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section title={canEdit ? "Workflow" : "Notes"}>
          {canEdit ? (
            <div className="space-y-3">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ZitfStatus)}
              >
                {(Object.keys(ZITF_STATUS_LABEL) as ZitfStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {ZITF_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
              {error ? (
                <p className="font-mono text-[11px] uppercase tracking-tag text-zimx-red">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[13px] text-zimx-black">
              {row.notes ? row.notes : (
                <span className="text-zinc-500">No notes yet.</span>
              )}
            </p>
          )}
        </Section>
      </Dialog.Body>

      {canEdit ? (
        <Dialog.Footer>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Dialog.Footer>
      ) : null}
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {title}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</dl>;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-tag text-zinc-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-zimx-black">
        {value ?? <span className="text-zinc-500">—</span>}
      </dd>
    </div>
  );
}
