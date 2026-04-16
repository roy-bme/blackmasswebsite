"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Pill from "@/components/ops/ui/Pill";
import Select from "@/components/ops/ui/Select";
import { cn } from "@/lib/ops/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Event } from "@/types/ops";

import DebriefForm from "./DebriefForm";
import { formatDateRange, parseIsoDate, todayUtc } from "./dateRange";
import {
  EVENT_TYPE_LABEL,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_PILL_CLASS,
  EVENT_TYPE_PILL_TONE,
  type EventType,
  type EventWithDebrief,
  type PersonMet,
  type UserLite,
} from "./types";

type EventDetailDialogProps = {
  event: EventWithDebrief | null;
  users: UserLite[];
  canEdit: boolean;
  currentUserId: string;
  onClose: () => void;
};

export default function EventDetailDialog({
  event,
  users,
  canEdit,
  currentUserId,
  onClose,
}: EventDetailDialogProps) {
  const router = useRouter();
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);

  async function saveField(column: keyof Event, value: unknown) {
    if (!event) return;
    setSavingField(column);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("events")
      .update({ [column]: value })
      .eq("id", event.id);
    setSavingField(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  if (!event) {
    return (
      <Dialog
        open={false}
        onClose={onClose}
        size="lg"
        ariaLabel="Event detail"
      >
        <div />
      </Dialog>
    );
  }

  const typeKey = (event.type ?? "") as EventType;
  const typeLabel = EVENT_TYPE_LABEL[typeKey] ?? event.type ?? "Event";
  const typeTone = EVENT_TYPE_PILL_TONE[typeKey] ?? "neutral";
  const typeClass = EVENT_TYPE_PILL_CLASS[typeKey];

  const userOptions = [
    { label: "Nobody assigned", value: "" },
    ...users.map((u) => ({ label: u.name, value: u.id })),
  ];

  const isPast =
    event.status === "attended" ||
    parseIsoDate(event.date).getTime() < todayUtc().getTime();

  return (
    <Dialog
      open={Boolean(event)}
      onClose={onClose}
      size="lg"
      ariaLabel={`${event.name} detail`}
    >
      <Dialog.Header>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog.Title className="truncate">{event.name}</Dialog.Title>
            <Pill tone={typeTone} size="sm" className={typeClass}>
              {typeLabel}
            </Pill>
            {event.debrief ? (
              <Pill tone="success" size="sm">
                Debrief logged
              </Pill>
            ) : null}
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            {formatDateRange(event.date, event.end_date)}
          </p>
        </div>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>

      <Dialog.Body className="space-y-5">
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
            value={event.name}
            canEdit={canEdit}
            saving={savingField === "name"}
            onSave={(v) => saveField("name", v)}
            required
          />
          <EditableText
            label="Location"
            value={event.location}
            canEdit={canEdit}
            saving={savingField === "location"}
            onSave={(v) => saveField("location", v || null)}
          />
          <EditableText
            label="Start date"
            value={event.date}
            canEdit={canEdit}
            saving={savingField === "date"}
            type="date"
            onSave={(v) => saveField("date", v)}
            required
          />
          <EditableText
            label="End date"
            value={event.end_date}
            canEdit={canEdit}
            saving={savingField === "end_date"}
            type="date"
            onSave={(v) => saveField("end_date", v || null)}
          />
          <SelectField
            label="Type"
            value={event.type ?? ""}
            canEdit={canEdit}
            saving={savingField === "type"}
            options={EVENT_TYPE_OPTIONS.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
            onSave={(v) => saveField("type", v || null)}
          />
          <EditableText
            label="Priority (1-5)"
            value={event.priority != null ? String(event.priority) : ""}
            canEdit={canEdit}
            saving={savingField === "priority"}
            type="number"
            onSave={(v) => {
              const n = v ? Number.parseInt(v, 10) : null;
              saveField("priority", n);
            }}
          />
          <EditableText
            label="Expected attendees"
            value={
              event.expected_attendees != null
                ? String(event.expected_attendees)
                : ""
            }
            canEdit={canEdit}
            saving={savingField === "expected_attendees"}
            type="number"
            onSave={(v) =>
              saveField(
                "expected_attendees",
                v ? Number.parseInt(v, 10) : null,
              )
            }
          />
          <EditableText
            label="Entry cost (USD)"
            value={event.entry_cost != null ? String(event.entry_cost) : ""}
            canEdit={canEdit}
            saving={savingField === "entry_cost"}
            type="number"
            onSave={(v) =>
              saveField("entry_cost", v ? Number.parseFloat(v) : null)
            }
          />
          <SelectField
            label="Attending"
            value={event.attending ?? ""}
            canEdit={canEdit}
            saving={savingField === "attending"}
            options={userOptions}
            onSave={(v) => saveField("attending", v || null)}
          />
          <ReadOnlyField
            label="Status"
            value={event.status === "attended" ? "Attended" : "Upcoming"}
          />
        </section>

        <EditableTextarea
          label="Notes"
          value={event.notes}
          canEdit={canEdit}
          saving={savingField === "notes"}
          onSave={(v) => saveField("notes", v || null)}
        />

        {isPast ? (
          <section className="space-y-3 border-t border-zinc-200 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[13px] uppercase tracking-tag text-zimx-black">
                Debrief
              </h3>
            </div>

            {event.debrief ? (
              <DebriefReadonly debrief={event.debrief} users={users} />
            ) : !debriefOpen ? (
              canEdit ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDebriefOpen(true)}
                >
                  Log debrief
                </Button>
              ) : (
                <p className="text-[13px] text-zinc-500">
                  No debrief logged yet.
                </p>
              )
            ) : (
              <DebriefForm
                eventId={event.id}
                currentUserId={currentUserId}
                onCancel={() => setDebriefOpen(false)}
              />
            )}
          </section>
        ) : null}
      </Dialog.Body>
    </Dialog>
  );
}

type DebriefReadonlyProps = {
  debrief: NonNullable<EventWithDebrief["debrief"]>;
  users: UserLite[];
};

function DebriefReadonly({ debrief, users }: DebriefReadonlyProps) {
  const submitter = users.find((u) => u.id === debrief.submitted_by);
  const people = extractPeopleMet(debrief.people_met);

  return (
    <div className="space-y-4 border border-zinc-200 bg-zimx-offwhite/40 p-4">
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        Submitted by {submitter?.name ?? "unknown"} on{" "}
        {new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(debrief.date_submitted))}
      </p>

      {people.length > 0 ? (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            People met
          </p>
          <ul className="mt-1.5 space-y-2">
            {people.map((person, i) => (
              <li
                key={i}
                className="border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zimx-black"
              >
                <p className="font-semibold">
                  {person.name}
                  {person.role ? (
                    <span className="ml-2 font-normal text-zinc-600">
                      &middot; {person.role}
                    </span>
                  ) : null}
                </p>
                {person.business ? (
                  <p className="text-zinc-500">{person.business}</p>
                ) : null}
                {person.discussed ? (
                  <p className="mt-1 text-zinc-600">{person.discussed}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ReadonlyPara label="Market intel" value={debrief.market_intel} />
      <ReadonlyPara
        label="Competitive intel"
        value={debrief.competitive_intel}
      />
      <ReadonlyPara label="Opportunities" value={debrief.opportunities} />
      <ReadonlyPara
        label="Follow-up actions"
        value={debrief.follow_up_actions}
      />
    </div>
  );
}

function ReadonlyPara({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[13px] text-zimx-black">
        {value}
      </p>
    </div>
  );
}

function extractPeopleMet(value: unknown): PersonMet[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      name: typeof v.name === "string" ? v.name : "",
      business: typeof v.business === "string" ? v.business : "",
      role: typeof v.role === "string" ? v.role : "",
      discussed: typeof v.discussed === "string" ? v.discussed : "",
    }));
}

type EditableTextProps = {
  label: string;
  value: string | null;
  canEdit: boolean;
  saving: boolean;
  type?: "text" | "number" | "date";
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
    const display = options.find((o) => o.value === value)?.label ?? "\u2014";
    return <ReadOnlyField label={label} value={display} />;
  }
  return (
    <div>
      <Select
        label={`${label}${saving ? " (saving\u2026)" : ""}`}
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
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
