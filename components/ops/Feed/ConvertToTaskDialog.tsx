"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { opsApiPost } from "@/lib/ops/api-client";
import type { Activity } from "@/types/ops";

import type { FeedUser } from "./types";

type ConvertToTaskDialogProps = {
  activity: Activity | null;
  users: FeedUser[];
  currentUserId: string;
  onClose: () => void;
};

function deriveTitle(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  const trimmed = firstLine.trim();
  if (!trimmed) return "";
  return trimmed.length > 120 ? trimmed.slice(0, 117) + "\u2026" : trimmed;
}

export default function ConvertToTaskDialog({
  activity,
  users,
  currentUserId,
  onClose,
}: ConvertToTaskDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      setTitle(deriveTitle(activity.content));
      setDescription(activity.content);
      setAssignedTo("");
      setDueDate("");
      setError(null);
    }
  }, [activity]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activity) return;

    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await opsApiPost<{ id: string }>("/api/ops/tasks/create", {
      title: cleanedTitle,
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Could not create task.");
      return;
    }

    onClose();
    router.refresh();
  }

  const userOptions = [
    { label: "Nobody assigned", value: "" },
    ...users.map((u) => ({ label: u.name, value: u.id })),
  ];

  return (
    <Dialog
      open={Boolean(activity)}
      onClose={onClose}
      size="md"
      ariaLabel="Convert activity to task"
    >
      <Dialog.Header>
        <Dialog.Title>Convert to task</Dialog.Title>
        <Dialog.CloseButton onClose={onClose} />
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
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-autofocus
          />

          <Textarea
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Assign to"
              name="assigned_to"
              value={assignedTo}
              options={userOptions}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
            <Input
              label="Due date"
              name="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </Dialog.Body>

        <Dialog.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving\u2026" : "Create task"}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
