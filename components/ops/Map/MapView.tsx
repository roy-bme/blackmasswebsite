"use client";

import { useCallback, useState } from "react";

import Card from "@/components/ops/ui/Card";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import EmptyState from "@/components/ops/ui/EmptyState";
import OfflineBanner from "@/components/ops/ui/OfflineBanner";
import Pill from "@/components/ops/ui/Pill";
import SectorDot from "@/components/ops/ui/SectorDot";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import Button from "@/components/ops/ui/Button";
import { opsApiPost } from "@/lib/ops/api-client";
import type { UserRole } from "@/types/ops";

import AddBusinessDialog from "./AddBusinessDialog";
import LogInteractionModal from "@/components/ops/Interactions/LogInteractionModal";
import MapActions from "./MapActions";
import MapFilters, { type MapFilter } from "./MapFilters";
import MapLegend from "./MapLegend";
import MapWrapper from "./MapWrapper";
import type {
  MapBusiness,
  MapIntroduction,
  MapLink,
  MapZone,
} from "./types";

type MapViewProps = {
  businesses: MapBusiness[];
  links: MapLink[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  canSeeIntros: boolean;
  canAddRecords: boolean;
  canDeleteRecords: boolean;
  role: UserRole;
  currentUserId: string;
};

export default function MapView({
  businesses,
  links,
  zones,
  introductions,
  canSeeIntros,
  canAddRecords,
  canDeleteRecords,
  role,
  currentUserId,
}: MapViewProps) {
  const [items, setItems] = useState(businesses);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [pinDropMode, setPinDropMode] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<
    { lat: number; lng: number } | null
  >(null);
  const [lastSector, setLastSector] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapBusiness | null>(null);
  const [movingPinId, setMovingPinId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [interactionBusinessId, setInteractionBusinessId] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!pinDropMode) return;
      if (movingPinId) {
        void opsApiPost("/api/ops/businesses/update", { id: movingPinId, patch: { lat: coords.lat, lng: coords.lng } });
        setItems((prev) => prev.map((b) => b.id === movingPinId ? { ...b, lat: coords.lat, lng: coords.lng } : b));
        setToast("Pin moved.");
        setMovingPinId(null);
        return;
      } else {
        setPendingCoords(coords);
        setDialogOpen(true);
      }
    },
    [pinDropMode, movingPinId],
  );

  const exitPinDrop = useCallback(() => {
    setPinDropMode(false);
    setQuickAddMode(false);
    setDialogOpen(false);
    setPendingCoords(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setPendingCoords(null);
    if (!quickAddMode) {
      setPinDropMode(false);
    }
  }, [quickAddMode]);

  const handleSaved = useCallback(
    ({ sector }: { sector: string }) => {
      setLastSector(sector);
      setDialogOpen(false);
      setPendingCoords(null);
      if (quickAddMode) {
        setToast("Pinned. Tap map for next.");
        window.setTimeout(() => setToast(null), 2200);
      } else {
        setPinDropMode(false);
      }
    },
    [quickAddMode],
  );

  const enterPinDrop = useCallback(() => {
    setPinDropMode(true);
    setPendingCoords(null);
    setDialogOpen(false);
  }, []);

  const toggleQuickAdd = useCallback(() => {
    setQuickAddMode((prev) => !prev);
  }, []);

  function openEdit(businessId: string) {
    const b = items.find((item) => item.id === businessId);
    if (!b) return;
    setSelected(b);
    setEditing(true);
    setForm({
      name: b.name, sector: b.sector, notes: b.notes ?? "", est_monthly_volume: b.est_monthly_volume?.toString() ?? "", zone_id: b.zone_id ?? "",
      decision_maker_name: b.decision_maker_name ?? "", decision_maker_title: b.decision_maker_title ?? "", phone: b.phone ?? "", email: b.email ?? "", linkedin: b.linkedin ?? "",
      key_suppliers: b.key_suppliers?.join(", ") ?? "", key_customers: b.key_customers?.join(", ") ?? "", pain_points: b.pain_points?.join(", ") ?? "", zimx_fit_score: b.zimx_fit_score?.toString() ?? "",
    });
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-5">
      <div className="md:hidden">
        <OfflineBanner />
      </div>

      <MapFilters
        active={filter}
        onChange={setFilter}
        canSeeContacts={canSeeIntros}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden border border-line-15">
          <MapWrapper
            businesses={items}
            links={links}
            zones={zones}
            introductions={introductions}
            filter={filter}
            showIntros={canSeeIntros}
            pinDropMode={pinDropMode && canAddRecords}
            movingPinId={movingPinId}
            onMapClick={handleMapClick}
            onEditBusiness={openEdit}
            onMoveBusiness={(id) => { setMovingPinId(id); setPinDropMode(true); setToast("Click on map to place pin."); }}
            onDeleteBusiness={(id) => { if (!canDeleteRecords) return; void opsApiPost("/api/ops/businesses/update", { id, patch: { active: false } }); setItems((p) => p.filter((b) => b.id !== id)); }}
            onLogInteraction={(id) => setInteractionBusinessId(id)}
          />
          {canAddRecords ? (
            <MapActions
              pinDropMode={pinDropMode}
              quickAddMode={quickAddMode}
              businesses={businesses}
              currentUserId={currentUserId}
              onEnterPinDrop={enterPinDrop}
              onExitPinDrop={exitPinDrop}
              onToggleQuickAdd={toggleQuickAdd}
            />
          ) : null}
          {toast ? (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-4 left-1/2 z-[600] -translate-x-1/2 border border-zimx-gold bg-ink-900/95 px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-zimx-gold shadow-lg"
            >
              {toast}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <Card padding="lg">
            <Eyebrow gold>territory · today</Eyebrow>
            <p className="mt-2 text-[20px] font-light tracking-tight text-white">
              {items.length} businesses · {links.length} links
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              {introductions.length} intros · {zones.length} zones
            </p>
          </Card>

          {items.slice(0, 5).map((b) => (
            <Card key={b.id} padding="md" interactive>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-white">
                    {b.name}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <SectorDot sector={b.sector} />
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                      {b.sector}
                      {b.est_monthly_volume
                        ? ` · $${Number(b.est_monthly_volume).toLocaleString()}/mo`
                        : ""}
                    </span>
                  </div>
                </div>
                {b.launch_6 ? <Pill tone="gold">L6</Pill> : null}
              </div>
            </Card>
          ))}
          {items.length === 0 ? (
            <EmptyState
              title="No businesses mapped yet."
              description={
                canAddRecords
                  ? "Drop a pin to add the first business."
                  : "Ask an admin to add the first business."
              }
            />
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <MapLegend />
      </div>

      {canAddRecords ? (
        <AddBusinessDialog
          open={dialogOpen && pendingCoords !== null}
          onClose={handleDialogClose}
          zones={zones}
          coords={pendingCoords}
          quickAddMode={quickAddMode}
          lastSector={lastSector}
          onSaved={handleSaved}
        />
      ) : null}
      {selected ? (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-line-10 bg-ink-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-white">Edit business</h3>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="space-y-2 text-white">
            {["name", "sector", "decision_maker_name", "decision_maker_title", "phone", "email", "linkedin", "est_monthly_volume", "zimx_fit_score", "key_suppliers", "key_customers", "pain_points"].map((k) => (
              <Input key={k} value={form[k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
            ))}
            <Textarea value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={4} />
          </div>
          {role !== "bd" ? <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" onClick={async () => {
            if (!selected) return;
            const patch = { name: form.name.trim(), sector: form.sector as MapBusiness["sector"], notes: form.notes?.trim() || null, est_monthly_volume: form.est_monthly_volume ? Number(form.est_monthly_volume) : null, zone_id: form.zone_id || null, decision_maker_name: form.decision_maker_name?.trim() || null, decision_maker_title: form.decision_maker_title?.trim() || null, phone: form.phone?.trim() || null, email: form.email?.trim() || null, linkedin: form.linkedin?.trim() || null, key_suppliers: (form.key_suppliers || "").split(",").map((s) => s.trim()).filter(Boolean), key_customers: (form.key_customers || "").split(",").map((s) => s.trim()).filter(Boolean), pain_points: (form.pain_points || "").split(",").map((s) => s.trim()).filter(Boolean), zimx_fit_score: form.zimx_fit_score ? Number(form.zimx_fit_score) : null };
            const res = await opsApiPost("/api/ops/businesses/update", { id: selected.id, patch });
            if (!res.ok) { alert("Save failed."); return; }
            setItems((prev) => prev.map((b) => (b.id === selected.id ? { ...b, ...patch } : b)));
            setSelected(null);
          }}>Save</Button><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Cancel</Button></div> : null}
        </div>
      ) : null}
      {interactionBusinessId ? <LogInteractionModal businessId={interactionBusinessId} businessName={items.find((b) => b.id === interactionBusinessId)?.name ?? "Business"} onClose={() => setInteractionBusinessId(null)} onSaved={() => {}} /> : null}
    </div>
  );
}
