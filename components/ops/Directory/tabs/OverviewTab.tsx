/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Select from "@/components/ops/ui/Select";
import { cn } from "@/lib/ops/cn";
import { SECTOR_LIST } from "@/lib/ops/sector-colors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Business, BusinessStage } from "@/types/ops";

import {
  STAGE_LABELS,
  STAGE_ORDER,
  type DirectoryBusiness,
  type DirectoryZone,
} from "../types";

type OverviewTabProps = {
  business: DirectoryBusiness;
  zones: DirectoryZone[];
  canEdit: boolean;
  onMutated: () => void;
};

const TYPE_OPTIONS = [
  { label: "Formal", value: "formal" },
  { label: "Informal", value: "informal" },
];

export default function OverviewTab({
  business,
  zones,
  canEdit,
  onMutated,
}: OverviewTabProps) {
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveField(column: keyof Business, value: unknown) {
    setSavingField(column);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ [column]: value })
      .eq("id", business.id);
    setSavingField(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onMutated();
  }

  const sectorOptions = SECTOR_LIST.filter((s) => s.key !== "contact").map(
    (s) => ({ label: s.label, value: s.key }),
  );
  const zoneOptions = zones.map((z) => ({ label: z.name, value: z.id }));
  const stageOptions = STAGE_ORDER.map((s) => ({
    label: STAGE_LABELS[s],
    value: s,
  }));

  return (
    <div className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EditableText
          label="Name"
          value={business.name}
          canEdit={canEdit}
          saving={savingField === "name"}
          onSave={(v) => saveField("name", v)}
          required
        />
        <SelectField
          label="Sector"
          value={business.sector}
          canEdit={canEdit}
          saving={savingField === "sector"}
          options={sectorOptions}
          onSave={(v) => saveField("sector", v)}
        />
        <SelectField
          label="Type"
          value={business.type}
          canEdit={canEdit}
          saving={savingField === "type"}
          options={TYPE_OPTIONS}
          onSave={(v) => saveField("type", v)}
        />
        <EditableText
          label="Sub sector"
          value={business.sub_sector}
          canEdit={canEdit}
          saving={savingField === "sub_sector"}
          onSave={(v) => saveField("sub_sector", v || null)}
        />
        <SelectField
          label="Zone"
          value={business.zone_id ?? ""}
          canEdit={canEdit}
          saving={savingField === "zone_id"}
          options={[{ label: "—", value: "" }, ...zoneOptions]}
          onSave={(v) => saveField("zone_id", v || null)}
        />
        <EditableText
          label="Address"
          value={business.address}
          canEdit={canEdit}
          saving={savingField === "address"}
          onSave={(v) => saveField("address", v || null)}
        />

        <SelectField
          label="Advance stage"
          value={business.onboarding_stage}
          canEdit={canEdit}
          saving={savingField === "onboarding_stage"}
          options={stageOptions}
          onSave={(v) => saveField("onboarding_stage", v as BusinessStage)}
        />
        <EditableText
          label="Est. monthly volume (USD)"
          value={
            business.est_monthly_volume != null
              ? String(business.est_monthly_volume)
              : ""
          }
          canEdit={canEdit}
          saving={savingField === "est_monthly_volume"}
          type="number"
          onSave={(v) =>
            saveField("est_monthly_volume", v ? Number(v) : null)
          }
        />

        <EditableText
          label="Decision maker"
          value={business.decision_maker_name}
          canEdit={canEdit}
          saving={savingField === "decision_maker_name"}
          onSave={(v) => saveField("decision_maker_name", v || null)}
        />
        <EditableText
          label="Decision maker title"
          value={business.decision_maker_title}
          canEdit={canEdit}
          saving={savingField === "decision_maker_title"}
          onSave={(v) => saveField("decision_maker_title", v || null)}
        />
        <EditableText
          label="Phone"
          value={business.phone}
          canEdit={canEdit}
          saving={savingField === "phone"}
          onSave={(v) => saveField("phone", v || null)}
        />
        <EditableText
          label="Email"
          value={business.email}
          canEdit={canEdit}
          saving={savingField === "email"}
          type="email"
          onSave={(v) => saveField("email", v || null)}
        />
        <EditableText
          label="LinkedIn"
          value={business.linkedin}
          canEdit={canEdit}
          saving={savingField === "linkedin"}
          onSave={(v) => saveField("linkedin", v || null)}
        />
        <ReadOnlyField
          label="Fit score"
          value={
            business.zimx_fit_score != null
              ? `\u2605 ${business.zimx_fit_score}/5`
              : "—"
          }
        />
      </section>

      <EditableTextarea
        label="Notes"
        value={business.notes}
        canEdit={canEdit}
        saving={savingField === "notes"}
        onSave={(v) => saveField("notes", v || null)}
      />

      <ArrayList
        label="Payment methods"
        values={business.payment_methods}
      />
      <ArrayList label="Key suppliers" values={business.key_suppliers} />
      <ArrayList label="Key customers" values={business.key_customers} />
      <ArrayList label="Pain points" values={business.pain_points} />

      <PhotosSection
        businessId={business.id}
        photos={business.photos ?? []}
        canEdit={canEdit}
        onMutated={onMutated}
      />
    </div>
  );
}

type EditableTextProps = {
  label: string;
  value: string | null;
  canEdit: boolean;
  saving: boolean;
  type?: "text" | "number" | "email";
  required?: boolean;
  onSave: (value: string) => void;
};

function EditableText({
  label,
  value,
  canEdit,
  saving,
  type = "text",
  required,
  onSave,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function enterEdit() {
    if (!canEdit) return;
    setDraft(value ?? "");
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (required && !next) return;
    if (next === (value ?? "")) return;
    onSave(next);
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
        {saving ? <span className="ml-2 text-zinc-400">saving…</span> : null}
      </p>
      {editing && canEdit ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
          className="mt-1 w-full border border-zimx-black bg-white px-2 py-1.5 text-[14px] text-zimx-black outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          className={cn(
            "mt-1 block w-full truncate border border-transparent px-2 py-1.5 text-left text-[14px] text-zimx-black",
            canEdit && "hover:border-zinc-200 hover:bg-zimx-offwhite",
          )}
        >
          {value ? value : <span className="text-zinc-400">—</span>}
        </button>
      )}
    </div>
  );
}

type EditableTextareaProps = {
  label: string;
  value: string | null;
  canEdit: boolean;
  saving: boolean;
  onSave: (value: string) => void;
};

function EditableTextarea({
  label,
  value,
  canEdit,
  saving,
  onSave,
}: EditableTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function enterEdit() {
    if (!canEdit) return;
    setDraft(value ?? "");
    setEditing(true);
    requestAnimationFrame(() => ref.current?.focus());
  }

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next === (value ?? "")) return;
    onSave(next);
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
        {saving ? <span className="ml-2 text-zinc-400">saving…</span> : null}
      </p>
      {editing && canEdit ? (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={4}
          className="mt-1 w-full border border-zimx-black bg-white px-2 py-1.5 text-[14px] text-zimx-black outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          className={cn(
            "mt-1 block w-full whitespace-pre-wrap border border-transparent px-2 py-1.5 text-left text-[14px] text-zimx-black",
            canEdit && "hover:border-zinc-200 hover:bg-zimx-offwhite",
          )}
        >
          {value ? value : <span className="text-zinc-400">—</span>}
        </button>
      )}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  canEdit: boolean;
  saving: boolean;
  options: Array<{ label: string; value: string }>;
  onSave: (value: string) => void;
};

function SelectField({
  label,
  value,
  canEdit,
  saving,
  options,
  onSave,
}: SelectFieldProps) {
  if (!canEdit) {
    const display = options.find((o) => o.value === value)?.label ?? "—";
    return <ReadOnlyField label={label} value={display} />;
  }
  return (
    <div>
      <Select
        label={`${label}${saving ? " (saving…)" : ""}`}
        name={label}
        value={value}
        options={options}
        onChange={(e) => {
          const next = e.target.value;
          if (next !== value) onSave(next);
        }}
      />
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
      </p>
      <p className="mt-1 px-2 py-1.5 text-[14px] text-zimx-black">
        {value || <span className="text-zinc-400">—</span>}
      </p>
    </div>
  );
}

function ArrayList({
  label,
  values,
}: {
  label: string;
  values: string[] | null;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
      </p>
      {values && values.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li
              key={v}
              className="border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zimx-black"
            >
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[13px] text-zinc-400">—</p>
      )}
    </div>
  );
}

type PhotosSectionProps = {
  businessId: string;
  photos: string[];
  canEdit: boolean;
  onMutated: () => void;
};

function PhotosSection({
  businessId,
  photos,
  canEdit,
  onMutated,
}: PhotosSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const path = `${businessId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
    const nextPhotos = [...photos, pub.publicUrl];

    const { error: updateError } = await supabase
      .from("businesses")
      .update({ photos: nextPhotos })
      .eq("id", businessId);

    setUploading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onMutated();
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
          Photos
        </p>
        {canEdit ? (
          <label className="inline-flex">
            <span className="sr-only">Upload photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <span className="inline-flex cursor-pointer items-center border border-zinc-200 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag text-zimx-black hover:bg-zimx-offwhite">
              {uploading ? "Uploading…" : "Upload photo"}
            </span>
          </label>
        ) : null}
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-2 font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}
      {photos.length > 0 ? (
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((url) => (
            <li
              key={url}
              className="aspect-square overflow-hidden border border-zinc-200 bg-zimx-offwhite"
            >
              <img
                src={url}
                alt="Business photo"
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13px] text-zinc-400">No photos yet.</p>
      )}
    </section>
  );
}
