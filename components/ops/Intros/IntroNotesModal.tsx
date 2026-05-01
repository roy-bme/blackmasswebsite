"use client";

import { useState } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Textarea from "@/components/ops/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";

type IntroNotesModalProps = {
  introId: string;
  initialNotes: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function IntroNotesModal({
  introId,
  initialNotes,
  onClose,
  onSaved,
}: IntroNotesModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await opsApiPost("/api/ops/introductions/update", {
      id: introId,
      notes,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save notes. Please try again.");
      return;
    }
    toast.success("Notes saved.");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onClose={onClose} size="md" ariaLabel="Edit intro notes">
      <Dialog.Header>
        <Dialog.Title>Add notes</Dialog.Title>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>
      <Dialog.Body>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Context, follow-ups, or anything Roy should know."
          data-autofocus
        />
      </Dialog.Body>
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
          {saving ? "Saving..." : "Save notes"}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
