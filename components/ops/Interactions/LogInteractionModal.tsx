"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import { opsApiPost } from "@/lib/ops/api-client";

type InteractionType = "call" | "visit" | "whatsapp" | "email" | "other";

const TYPES: Array<{ id: InteractionType; label: string }> = [
  { id: "call", label: "Call" },
  { id: "visit", label: "Visit" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "other", label: "Other" },
];

export default function LogInteractionModal({ businessId, businessName, onClose, onSaved }: { businessId: string; businessName: string; onClose: () => void; onSaved: () => void; }) {
  const [type, setType] = useState<InteractionType>("call");
  const [outcome, setOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mappedError = useMemo(() => ({
    invalid_business_id: "Business reference is invalid.",
    invalid_type: "Please choose a valid interaction type.",
    invalid_next_action_date: "Please use a valid follow-up date.",
    db_error: "Could not save interaction. Please try again.",
  }), []);

  async function saveInteraction() {
    setSaving(true);
    setError(null);
    const res = await opsApiPost("/api/ops/interactions/create", {
      business_id: businessId,
      type,
      outcome,
      next_action: nextAction,
      next_action_date: nextActionDate || null,
    });
    setSaving(false);

    if (!res.ok) {
      const code = res.error as keyof typeof mappedError | undefined;
      setError((code && mappedError[code]) || "Unable to save interaction.");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Dialog open onClose={onClose} size="md" ariaLabel="Log interaction">
      <Dialog.Header>
        <Dialog.Title>Log interaction — {businessName}</Dialog.Title>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>
      <Dialog.Body>
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">Type</div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((item) => (
                <button key={item.id} type="button" onClick={() => setType(item.id)} className={`rounded-full border px-3 py-1.5 text-xs ${type === item.id ? "border-zimx-gold bg-zimx-gold/15 text-zimx-gold" : "border-line-15 text-fg-mute hover:text-white"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">What happened?</div>
            <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What happened?" rows={4} />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">Follow-up action?</div>
            <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Follow-up action?" />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">Next action date</div>
            <Input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
          </div>
          {error ? <div className="text-xs text-rose-300">{error}</div> : null}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={saveInteraction} disabled={saving}>{saving ? "Saving..." : "Save Interaction"}</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
