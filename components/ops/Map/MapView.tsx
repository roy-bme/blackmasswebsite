"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Card from "@/components/ops/ui/Card";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import EmptyState from "@/components/ops/ui/EmptyState";
import OfflineBanner from "@/components/ops/ui/OfflineBanner";
import Pill from "@/components/ops/ui/Pill";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import Button from "@/components/ops/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";

import AddBusinessDialog from "./AddBusinessDialog";
import LogInteractionModal from "@/components/ops/Interactions/LogInteractionModal";
import MapActions from "./MapActions";
import MapFilters from "./MapFilters";
import MapLegend from "./MapLegend";
import MapWrapper from "./MapWrapper";
import type {
  MapBusiness,
  MapDiscoveryCandidate,
  MapIntroduction,
  MapLink,
  MapZone,
} from "./types";

type MapViewProps = {
  businesses: MapBusiness[];
  links: MapLink[];
  discoveryCandidates: MapDiscoveryCandidate[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  canSeeIntros: boolean;
  canAddRecords: boolean;
  canDeleteRecords: boolean;
  currentUserId: string;
};

export default function MapView({
  businesses,
  links,
  discoveryCandidates,
  zones,
  introductions,
  canSeeIntros,
  canAddRecords,
  canDeleteRecords,
  currentUserId,
}: MapViewProps) {
  const toast = useToast();
  const [items, setItems] = useState(businesses);
  const [showBrendon, setShowBrendon] = useState(true);
  const [showTafadzwa, setShowTafadzwa] = useState(true);
  const [showUnattributed, setShowUnattributed] = useState(true);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<
    { lat: number; lng: number } | null
  >(null);
  const [lastSector, setLastSector] = useState<string>("");
  const [hint, setHint] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapBusiness | null>(null);
  const [movingPinId, setMovingPinId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [interactionBusinessId, setInteractionBusinessId] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<MapDiscoveryCandidate | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const BRENDON_UUID = "b15b3634-51b4-493a-a80b-662f219164ca";
  const TAFADZWA_UUID = "458fc192-05a2-472b-9ade-c22cd16ad0e3";
  const ROY_UUID = "fb29427f-8ed4-4cb2-8ed8-7d134d3a960f";

  const visibleByOwner = useCallback(
    (b: MapBusiness) => {
      const isTafadzwa = b.mapped_by === TAFADZWA_UUID;
      const isBrendon = b.mapped_by === BRENDON_UUID;
      const isUnattributed = b.mapped_by == null || b.mapped_by === ROY_UUID;
      if (isTafadzwa && !showTafadzwa) return false;
      if (isBrendon && !showBrendon) return false;
      if (isUnattributed && !showUnattributed) return false;
      return true;
    },
    [showBrendon, showTafadzwa, showUnattributed],
  );

  const recentlyAdded = useMemo(() => {
    return items
      .filter(visibleByOwner)
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      .slice(0, 5);
  }, [items, visibleByOwner]);

  const sidebarList = useMemo(() => {
    if (!activeBusinessId) return recentlyAdded;
    if (recentlyAdded.some((b) => b.id === activeBusinessId)) return recentlyAdded;
    const active = items.find((b) => b.id === activeBusinessId);
    if (!active) return recentlyAdded;
    return [active, ...recentlyAdded];
  }, [activeBusinessId, items, recentlyAdded]);

  useEffect(() => {
    if (!activeBusinessId) return;
    const node = cardRefs.current[activeBusinessId];
    if (node) node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeBusinessId]);

  const handleSelectFromCard = useCallback(
    (b: MapBusiness) => {
      setActiveBusinessId(b.id);
      setFlyToTarget((prev) => ({ lat: b.lat, lng: b.lng, key: (prev?.key ?? 0) + 1 }));
    },
    [],
  );

  const handleSelectFromPin = useCallback((businessId: string) => {
    setActiveBusinessId(businessId);
  }, []);

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!canAddRecords || !pinDropMode) return;
      if (movingPinId) {
        const targetId = movingPinId;
        const previous = items.find((b) => b.id === targetId);
        setItems((prev) => prev.map((b) => b.id === targetId ? { ...b, lat: coords.lat, lng: coords.lng } : b));
        setMovingPinId(null);
        void (async () => {
          const res = await opsApiPost("/api/ops/businesses/update", { id: targetId, patch: { lat: coords.lat, lng: coords.lng } });
          if (!res.ok) {
            if (previous) {
              setItems((prev) => prev.map((b) => b.id === targetId ? { ...b, lat: previous.lat, lng: previous.lng } : b));
            }
            toast.error("Could not move pin. Reverted.");
            return;
          }
          setHint("Pin moved.");
          window.setTimeout(() => setHint(null), 2200);
        })();
        return;
      } else {
        setPendingCoords(coords);
        setDialogOpen(true);
      }
    },
    [canAddRecords, pinDropMode, movingPinId, items, toast],
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
        setHint("Pinned. Tap map for next.");
        window.setTimeout(() => setHint(null), 2200);
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
        brendonCount={items.filter((b) => b.mapped_by === "b15b3634-51b4-493a-a80b-662f219164ca").length}
        tafadzwaCount={items.filter((b) => b.mapped_by === "458fc192-05a2-472b-9ade-c22cd16ad0e3").length}
        unattributedCount={items.filter((b) => b.mapped_by === null || b.mapped_by === "fb29427f-8ed4-4cb2-8ed8-7d134d3a960f").length}
        candidateCount={discoveryCandidates.length}
        showBrendon={showBrendon}
        showTafadzwa={showTafadzwa}
        showUnattributed={showUnattributed}
        showCandidates={showCandidates}
        onToggleBrendon={setShowBrendon}
        onToggleTafadzwa={setShowTafadzwa}
        onToggleUnattributed={setShowUnattributed}
        onToggleCandidates={setShowCandidates}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden border border-line-15">
          <MapWrapper
            businesses={items}
            discoveryCandidates={discoveryCandidates}
            links={links}
            zones={zones}
            introductions={introductions}
            showBrendon={showBrendon}
            showTafadzwa={showTafadzwa}
            showUnattributed={showUnattributed}
            showIntros={canSeeIntros}
            pinDropMode={pinDropMode && canAddRecords}
            movingPinId={movingPinId}
            onMapClick={handleMapClick}
            onEditBusiness={canAddRecords ? openEdit : undefined}
            onMoveBusiness={canAddRecords ? (id) => { setMovingPinId(id); setPinDropMode(true); setHint("Click on map to place pin."); } : undefined}
            onDeleteBusiness={(id) => {
              if (!canDeleteRecords) return;
              const prevList = items;
              setItems((p) => p.filter((b) => b.id !== id));
              void (async () => {
                const res = await opsApiPost("/api/ops/businesses/update", { id, patch: { active: false } });
                if (!res.ok) {
                  setItems(prevList);
                  toast.error("Could not delete business. Restored.");
                  return;
                }
                toast.success("Business deleted.");
              })();
            }}
            onLogInteraction={(id) => setInteractionBusinessId(id)}
            onSelectBusiness={handleSelectFromPin}
            flyToTarget={flyToTarget}
            showCandidates={showCandidates}
            onOpenCandidate={(id) => setSelectedCandidate(discoveryCandidates.find((c) => c.id === id) ?? null)}
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
          {hint ? (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-4 left-1/2 z-[600] -translate-x-1/2 border border-zimx-gold bg-ink-900/95 px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-zimx-gold shadow-lg"
            >
              {hint}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <Card padding="lg">
            <Eyebrow gold>territory · today</Eyebrow>
            <p className="mt-2 text-[20px] font-light tracking-tight text-white">
              {items.length} businesses (B:{items.filter((b) => b.mapped_by === "b15b3634-51b4-493a-a80b-662f219164ca").length} · T:{items.filter((b) => b.mapped_by === "458fc192-05a2-472b-9ade-c22cd16ad0e3").length} · ?:{items.filter((b) => b.mapped_by === null || b.mapped_by === "fb29427f-8ed4-4cb2-8ed8-7d134d3a960f").length}) · {discoveryCandidates.length} candidates · {links.length} links · {zones.length} zones
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-eyebrow text-fg-mute">
              Brendon: {items.filter((b) => b.mapped_by === "b15b3634-51b4-493a-a80b-662f219164ca").length} · Tafadzwa: {items.filter((b) => b.mapped_by === "458fc192-05a2-472b-9ade-c22cd16ad0e3").length} · Unattributed: {items.filter((b) => b.mapped_by === null || b.mapped_by === "fb29427f-8ed4-4cb2-8ed8-7d134d3a960f").length} · Intros: {introductions.length}
            </p>
          </Card>

          {sidebarList.length > 0 ? (
            <Eyebrow className="mt-1 px-1">recently added</Eyebrow>
          ) : null}
          {sidebarList.map((b) => {
            const isActive = b.id === activeBusinessId;
            return (
              <Card
                key={b.id}
                padding="md"
                interactive
                accent={isActive ? "gold" : undefined}
                ref={(node) => {
                  cardRefs.current[b.id] = node;
                }}
                onClick={() => handleSelectFromCard(b)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-white">
                      {b.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: b.mapped_by === TAFADZWA_UUID ? "#D4A843" : "#319B42" }} />
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                        {b.sector}
                        {b.est_monthly_volume
                          ? ` · $${Number(b.est_monthly_volume).toLocaleString()}/mo`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
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
          <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" onClick={async () => {
            if (!selected) return;
            const patch = { name: form.name.trim(), sector: form.sector as MapBusiness["sector"], notes: form.notes?.trim() || null, est_monthly_volume: form.est_monthly_volume ? Number(form.est_monthly_volume) : null, zone_id: form.zone_id || null, decision_maker_name: form.decision_maker_name?.trim() || null, decision_maker_title: form.decision_maker_title?.trim() || null, phone: form.phone?.trim() || null, email: form.email?.trim() || null, linkedin: form.linkedin?.trim() || null, key_suppliers: (form.key_suppliers || "").split(",").map((s) => s.trim()).filter(Boolean), key_customers: (form.key_customers || "").split(",").map((s) => s.trim()).filter(Boolean), pain_points: (form.pain_points || "").split(",").map((s) => s.trim()).filter(Boolean), zimx_fit_score: form.zimx_fit_score ? Number(form.zimx_fit_score) : null };
            const res = await opsApiPost("/api/ops/businesses/update", { id: selected.id, patch });
            if (!res.ok) { toast.error("Could not save changes. Try again."); return; }
            setItems((prev) => prev.map((b) => (b.id === selected.id ? { ...b, ...patch } : b)));
            toast.success("Business updated.");
            setSelected(null);
          }}>Save</Button><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Cancel</Button></div>
        </div>
      ) : null}
      {interactionBusinessId ? <LogInteractionModal businessId={interactionBusinessId} businessName={items.find((b) => b.id === interactionBusinessId)?.name ?? "Business"} onClose={() => setInteractionBusinessId(null)} onSaved={() => {}} /> : null}
      {selectedCandidate ? <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-line-10 bg-ink-900 p-4 text-white">
        <div className="mb-3 flex items-center justify-between"><h3>UNVERIFIED — Bot Discovery</h3><Button size="sm" variant="ghost" onClick={() => setSelectedCandidate(null)}>Close</Button></div>
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{selectedCandidate.name}</div>
          <div>{selectedCandidate.sector ?? "Unknown sector"} · {selectedCandidate.address ?? "No address"}</div>
          <div>Confidence: {"★".repeat(selectedCandidate.discovery_confidence ?? 0)}{"☆".repeat(5 - (selectedCandidate.discovery_confidence ?? 0))}</div>
          <div>Discovered: {new Date(selectedCandidate.discovered_at).toLocaleString()}</div>
          {selectedCandidate.source_url ? <a className="text-zimx-gold underline" href={selectedCandidate.source_url} target="_blank">Source URL</a> : null}
          {selectedCandidate.enrichment_raw ? <details><summary className="cursor-pointer">Enrichment JSON</summary><pre className="mt-2 max-h-56 overflow-auto rounded bg-ink-800 p-2 text-xs">{JSON.stringify(selectedCandidate.enrichment_raw, null, 2)}</pre></details> : null}
          <Textarea value={reviewNotes} onChange={(e)=>setReviewNotes(e.target.value)} rows={3} placeholder="Review notes (optional)" />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={async()=>{const res=await opsApiPost('/api/ops/discovery-candidates/review',{candidateId:selectedCandidate.id,action:'promote',reviewNotes}); if(!res.ok){toast.error('Could not promote candidate.'); return;} toast.success('Candidate promoted. Refreshing...'); window.location.reload();}}>Confirm / Promote</Button>
            <Button size="sm" variant="ghost" onClick={async()=>{const res=await opsApiPost('/api/ops/discovery-candidates/review',{candidateId:selectedCandidate.id,action:'reject',reviewNotes}); if(!res.ok){toast.error('Could not reject candidate.'); return;} setSelectedCandidate(null); window.location.reload();}}>Reject</Button>
            <Button size="sm" variant="ghost" onClick={async()=>{const res=await opsApiPost('/api/ops/discovery-candidates/review',{candidateId:selectedCandidate.id,action:'hold',reviewNotes}); if(!res.ok){toast.error('Could not hold candidate.'); return;} setSelectedCandidate(null); window.location.reload();}}>Hold</Button>
          </div>
        </div>
      </div> : null}
    </div>
  );
}
