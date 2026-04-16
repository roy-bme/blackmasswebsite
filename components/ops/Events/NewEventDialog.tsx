"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { EVENT_TYPE_OPTIONS, type EventType } from "./types";

type NewEventDialogProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  date: string;
  end_date: string;
  location: string;
  type: EventType;
  priority: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  date: "",
  end_date: "",
  location: "",
  type: "trade_fair",
  priority: "3",
  notes: "",
};

export default function NewEventDialog({ open, onClose }: NewEventDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!form.date) {
      setError("Start date is required.");
      return;
    }

    const priorityNum = form.priority ? Number.parseInt(form.priority, 10) : null;
    if (priorityNum != null && (priorityNum < 1 || priorityNum > 5)) {
      setError("Priority must be between 1 and 5.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("events").insert({
      name: form.name.trim(),
      date: form.date,
      end_date: form.end_date || null,
      location: form.location.trim() || null,
      type: form.type,
      priority: priorityNum,
      notes: form.notes.trim() || null,
      status: "upcoming",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    resetAndClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      size="md"
      ariaLabel="New event"
    >
      <Dialog.Header>
        <Dialog.Title>New event</Dialog.Title>
        <Dialog.CloseButton onClose={resetAndClose} />
      </Dialog.Header>

      <form onSubmit={handleSubmit}>
        <Dialog.Body className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
            >
              {error}
            </p>
          ) : null}

          <Input
            label="Event name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            data-autofocus
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Start date"
              name="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Input
              label="End date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              hint="Optional — leave blank for single-day events."
            />
          </div>

          <Input
            label="Location"
            name="location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Type"
              name="type"
              value={form.type}
              options={EVENT_TYPE_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as EventType })
              }
            />
            <Input
              label="Priority (1-5)"
              name="priority"
              type="number"
              min={1}
              max={5}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </Dialog.Body>

        <Dialog.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving\u2026" : "Add event"}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
