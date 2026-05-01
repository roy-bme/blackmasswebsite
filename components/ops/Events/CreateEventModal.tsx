"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BusinessOption = { id: string; name: string };

type CreateEventModalProps = {
  onClose: () => void;
  onSaved: () => void;
};

export default function CreateEventModal({ onClose, onSaved }: CreateEventModalProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [linkedBusiness, setLinkedBusiness] = useState<string>("");
  const [options, setOptions] = useState<BusinessOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("businesses")
        .select("id, name")
        .order("name", { ascending: true });
      setOptions((data ?? []) as BusinessOption[]);
    })();
  }, []);

  async function handleSave() {
    if (!name.trim() || !date) return;
    setSaving(true);
    const linkedName = options.find((o) => o.id === linkedBusiness)?.name ?? null;
    const desc = description.trim();
    const composedNotes =
      linkedName && desc
        ? `Linked: ${linkedName}\n\n${desc}`
        : linkedName
          ? `Linked: ${linkedName}`
          : desc || null;
    const res = await opsApiPost("/api/ops/events/create", {
      name: name.trim(),
      date,
      location: location.trim() || null,
      notes: composedNotes,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not create event. Try again.");
      return;
    }
    toast.success("Event logged.");
    onSaved();
    onClose();
  }

  return (
    <Dialog open onClose={onClose} size="md" ariaLabel="Log event">
      <Dialog.Header>
        <Dialog.Title>Log event</Dialog.Title>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>
      <Dialog.Body>
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              Title
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BCCI luncheon, trade fair, etc."
              data-autofocus
            />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              Description
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's the purpose? Who's attending?"
            />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              Date
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              Location
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bulawayo · Holiday Inn"
            />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              Business linked (optional)
            </div>
            <select
              className="w-full border border-line-15 bg-ink-700 px-3 py-2.5 text-[14px] text-white focus:border-zimx-gold focus:outline-none"
              value={linkedBusiness}
              onChange={(e) => setLinkedBusiness(e.target.value)}
            >
              <option value="">— None —</option>
              {options.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || !name.trim() || !date}
        >
          {saving ? "Creating..." : "Create Event"}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
