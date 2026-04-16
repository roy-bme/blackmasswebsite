"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { EMPTY_PERSON_MET, type PersonMet } from "./types";

type DebriefFormProps = {
  eventId: string;
  currentUserId: string;
  onCancel: () => void;
};

type FormState = {
  people_met: PersonMet[];
  market_intel: string;
  competitive_intel: string;
  opportunities: string;
  follow_up_actions: string;
};

const EMPTY_FORM: FormState = {
  people_met: [{ ...EMPTY_PERSON_MET }],
  market_intel: "",
  competitive_intel: "",
  opportunities: "",
  follow_up_actions: "",
};

export default function DebriefForm({
  eventId,
  currentUserId,
  onCancel,
}: DebriefFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePerson(
    index: number,
    field: keyof PersonMet,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      people_met: prev.people_met.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }));
  }

  function addPerson() {
    setForm((prev) => ({
      ...prev,
      people_met: [...prev.people_met, { ...EMPTY_PERSON_MET }],
    }));
  }

  function removePerson(index: number) {
    setForm((prev) => ({
      ...prev,
      people_met: prev.people_met.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const cleanedPeople = form.people_met
      .map((p) => ({
        name: p.name.trim(),
        business: p.business.trim(),
        role: p.role.trim(),
        discussed: p.discussed.trim(),
      }))
      .filter(
        (p) => p.name || p.business || p.role || p.discussed,
      );

    const supabase = createSupabaseBrowserClient();
    const submitterId = currentUserId;
    const { error: insertError } = await supabase
      .from("event_debriefs")
      .insert({
        event_id: eventId,
        submitted_by: submitterId,
        people_met: cleanedPeople.length > 0 ? cleanedPeople : null,
        market_intel: form.market_intel.trim() || null,
        competitive_intel: form.competitive_intel.trim() || null,
        opportunities: form.opportunities.trim() || null,
        follow_up_actions: form.follow_up_actions.trim() || null,
      });

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    const { error: statusError } = await supabase
      .from("events")
      .update({ status: "attended" })
      .eq("id", eventId);

    setSubmitting(false);

    if (statusError) {
      setError(statusError.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
          People met
        </p>
        <ul className="space-y-3">
          {form.people_met.map((person, i) => (
            <li
              key={i}
              className="relative grid grid-cols-1 gap-2 border border-zinc-200 bg-zimx-offwhite/50 p-3 sm:grid-cols-2"
            >
              <Input
                label="Name"
                name={`person-name-${i}`}
                value={person.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
              />
              <Input
                label="Business"
                name={`person-business-${i}`}
                value={person.business}
                onChange={(e) => updatePerson(i, "business", e.target.value)}
              />
              <Input
                label="Role"
                name={`person-role-${i}`}
                value={person.role}
                onChange={(e) => updatePerson(i, "role", e.target.value)}
              />
              <Input
                label="What you discussed"
                name={`person-discussed-${i}`}
                value={person.discussed}
                onChange={(e) => updatePerson(i, "discussed", e.target.value)}
              />
              {form.people_met.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removePerson(i)}
                  aria-label={`Remove person ${i + 1}`}
                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center border border-transparent font-mono text-[14px] text-zinc-500 hover:border-zinc-200 hover:bg-white hover:text-zimx-red"
                >
                  &times;
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" size="sm" onClick={addPerson}>
          + Add person
        </Button>
      </div>

      <Textarea
        label="Market intel"
        name="market_intel"
        value={form.market_intel}
        onChange={(e) => setForm({ ...form, market_intel: e.target.value })}
        rows={3}
      />
      <Textarea
        label="Competitive intel"
        name="competitive_intel"
        value={form.competitive_intel}
        onChange={(e) =>
          setForm({ ...form, competitive_intel: e.target.value })
        }
        rows={3}
      />
      <Textarea
        label="Opportunities"
        name="opportunities"
        value={form.opportunities}
        onChange={(e) => setForm({ ...form, opportunities: e.target.value })}
        rows={3}
      />
      <Textarea
        label="Follow-up actions"
        name="follow_up_actions"
        value={form.follow_up_actions}
        onChange={(e) =>
          setForm({ ...form, follow_up_actions: e.target.value })
        }
        rows={3}
      />

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving\u2026" : "Submit debrief"}
        </Button>
      </div>
    </form>
  );
}
