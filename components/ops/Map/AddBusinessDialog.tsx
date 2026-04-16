"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { SECTOR_LIST } from "@/lib/ops/sector-colors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { MapZone } from "./types";

type AddBusinessDialogProps = {
  open: boolean;
  onClose: () => void;
  zones: MapZone[];
  currentUserId: string;
};

const EMPTY_FORM = {
  name: "",
  sector: "",
  zone_id: "",
  est_monthly_volume: "",
  notes: "",
};

export default function AddBusinessDialog({
  open,
  onClose,
  zones,
  currentUserId,
}: AddBusinessDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.sector) {
      setError("Sector is required.");
      return;
    }
    if (!form.zone_id) {
      setError("Zone is required.");
      return;
    }

    const zone = zones.find((z) => z.id === form.zone_id);
    if (!zone || zone.centre_lat == null || zone.centre_lng == null) {
      setError("Selected zone has no coordinates.");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const lat = zone.centre_lat + (Math.random() * 0.008 - 0.004);
    const lng = zone.centre_lng + (Math.random() * 0.008 - 0.004);
    const volume = form.est_monthly_volume
      ? Number(form.est_monthly_volume)
      : null;

    const { error: insertError } = await supabase.from("businesses").insert({
      name: form.name.trim(),
      sector: form.sector,
      type: "formal",
      zone_id: form.zone_id,
      lat,
      lng,
      est_monthly_volume: volume,
      notes: form.notes.trim() || null,
      mapped_by: currentUserId,
      launch_6: false,
      onboarding_stage: "identified",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(EMPTY_FORM);
    onClose();
    router.refresh();
  }

  const sectorOptions = SECTOR_LIST.filter((s) => s.key !== "contact").map(
    (s) => ({ label: s.label, value: s.key }),
  );
  const zoneOptions = zones.map((z) => ({ label: z.name, value: z.id }));

  return (
    <Dialog open={open} onClose={handleClose} ariaLabel="Add business">
      <Dialog.Header>
        <Dialog.Title>Add business</Dialog.Title>
        <Dialog.CloseButton onClose={handleClose} />
      </Dialog.Header>
      <form onSubmit={handleSubmit}>
        <Dialog.Body className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            data-autofocus
          />
          <Select
            label="Sector"
            name="sector"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            placeholder="Select sector"
            options={sectorOptions}
            required
          />
          <Select
            label="Zone"
            name="zone_id"
            value={form.zone_id}
            onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
            placeholder="Select zone"
            options={zoneOptions}
            required
          />
          <Input
            label="Est. monthly volume (USD)"
            name="est_monthly_volume"
            type="number"
            min={0}
            inputMode="numeric"
            value={form.est_monthly_volume}
            onChange={(e) =>
              setForm({ ...form, est_monthly_volume: e.target.value })
            }
          />
          <Textarea
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
            >
              {error}
            </p>
          ) : null}
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save business"}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
