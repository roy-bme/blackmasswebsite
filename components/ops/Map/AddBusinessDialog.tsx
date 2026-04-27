"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { opsApiPost } from "@/lib/ops/api-client";
import { formatCoords, reverseGeocode } from "@/lib/ops/reverse-geocode";
import { PRIMARY_SECTORS, SECTOR_THEMES } from "@/lib/ops/sector-colors";
import { getZoneBounds, pointInBounds } from "@/lib/ops/zone-bounds";

import type { MapZone } from "./types";

type AddBusinessDialogProps = {
  open: boolean;
  onClose: () => void;
  zones: MapZone[];
  /** Lat/lng captured from the user's map click. Required for the dialog to
   *  submit — if null we show a "tap the map first" state. */
  coords: { lat: number; lng: number } | null;
  /** Quick-add collapses the form to just name/sector/notes and keeps the
   *  map in pin-drop mode after save. */
  quickAddMode: boolean;
  /** Last sector chosen during a quick-add session so consecutive pins on
   *  the same street don't re-pick the dropdown each time. */
  lastSector: string;
  /** Fired after a successful insert. The map coordinator uses this to keep
   *  pin-drop mode on (quick-add) and capture the sector. */
  onSaved: (info: { sector: string }) => void;
};

type FormState = {
  name: string;
  sector: string;
  zone_id: string;
  est_monthly_volume: string;
  notes: string;
};

function emptyForm(sector: string): FormState {
  return {
    name: "",
    sector,
    zone_id: "",
    est_monthly_volume: "",
    notes: "",
  };
}

export default function AddBusinessDialog({
  open,
  onClose,
  zones,
  coords,
  quickAddMode,
  lastSector,
  onSaved,
}: AddBusinessDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => emptyForm(lastSector));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(lastSector));
    setError(null);
    setAddress(null);
  }, [open, lastSector]);

  // Auto-resolve zone_id via point-in-bounds whenever coords change.
  useEffect(() => {
    if (!open || !coords) return;
    for (const zone of zones) {
      const bounds = getZoneBounds({
        name: zone.name,
        centre_lat: zone.centre_lat,
        centre_lng: zone.centre_lng,
      });
      if (bounds && pointInBounds(coords, bounds)) {
        setForm((prev) =>
          prev.zone_id ? prev : { ...prev, zone_id: zone.id },
        );
        return;
      }
    }
  }, [open, coords, zones]);

  useEffect(() => {
    if (!open || !coords) {
      setAddress(null);
      setAddressLoading(false);
      return;
    }
    const controller = new AbortController();
    setAddressLoading(true);
    setAddress(null);
    reverseGeocode(coords.lat, coords.lng, controller.signal)
      .then((resolved) => setAddress(resolved))
      .catch(() => setAddress(null))
      .finally(() => setAddressLoading(false));
    return () => controller.abort();
  }, [open, coords]);

  function handleClose() {
    if (submitting) return;
    setForm(emptyForm(lastSector));
    setError(null);
    setAddress(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!coords) {
      setError("Tap the map first to place the pin.");
      return;
    }
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.sector) {
      setError("Sector is required.");
      return;
    }

    setSubmitting(true);
    const volume = form.est_monthly_volume
      ? Number(form.est_monthly_volume)
      : null;

    const res = await opsApiPost<{ id: string }>(
      "/api/ops/businesses/create",
      {
        name: form.name.trim(),
        sector: form.sector,
        type: "formal",
        zone_id: form.zone_id || null,
        lat: coords.lat,
        lng: coords.lng,
        address: address ?? null,
        est_monthly_volume: volume,
        notes: form.notes.trim() || null,
        launch_6: false,
      },
    );

    setSubmitting(false);

    if (!res.ok) {
      setError("Could not save business.");
      return;
    }

    onSaved({ sector: form.sector });
    setForm(emptyForm(form.sector));
    router.refresh();
  }

  const sectorOptions = useMemo(
    () =>
      PRIMARY_SECTORS.map((key) => ({
        label: SECTOR_THEMES[key].label,
        value: key,
      })),
    [],
  );
  const zoneOptions = useMemo(
    () => [
      { label: "Auto / none", value: "" },
      ...zones.map((z) => ({ label: z.name, value: z.id })),
    ],
    [zones],
  );

  const locationDisplay = address
    ? address
    : addressLoading
      ? "Looking up address…"
      : coords
        ? `Bulawayo (${formatCoords(coords.lat, coords.lng)})`
        : "—";

  const submitLabel = submitting
    ? "Saving…"
    : quickAddMode
      ? "Save & drop next"
      : "Save business";

  return (
    <Dialog open={open} onClose={handleClose} ariaLabel="Add business">
      <Dialog.Header>
        <Dialog.Title>
          {quickAddMode ? "Quick add business" : "Add business"}
        </Dialog.Title>
        <Dialog.CloseButton onClose={handleClose} />
      </Dialog.Header>
      <form onSubmit={handleSubmit}>
        <Dialog.Body className="space-y-4">
          {!coords ? (
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-mute">
              Tap the map first to place a pin.
            </p>
          ) : (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                Location
              </p>
              <p className="mt-1 flex items-center gap-2 border border-line-15 bg-ink-700 px-3 py-2 text-[13px] text-white">
                <span className="truncate">{locationDisplay}</span>
                {addressLoading ? (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-line-20 border-t-zimx-gold"
                  />
                ) : null}
              </p>
              {!address && !addressLoading ? (
                <p className="mt-1 font-mono text-[10px] text-fg-dim">
                  {formatCoords(coords.lat, coords.lng)}
                </p>
              ) : null}
            </div>
          )}

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

          {quickAddMode ? null : (
            <>
              <Select
                label="Zone"
                name="zone_id"
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                placeholder="Auto / none"
                options={zoneOptions}
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
            </>
          )}
          <Textarea
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-eyebrow text-status-bad"
            >
              {error}
            </p>
          ) : null}
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !coords}>
            {submitLabel}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
