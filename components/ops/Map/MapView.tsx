"use client";

import { useCallback, useState } from "react";

import Card from "@/components/ops/ui/Card";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import EmptyState from "@/components/ops/ui/EmptyState";
import OfflineBanner from "@/components/ops/ui/OfflineBanner";
import Pill from "@/components/ops/ui/Pill";
import SectorDot from "@/components/ops/ui/SectorDot";

import AddBusinessDialog from "./AddBusinessDialog";
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
  currentUserId: string;
};

export default function MapView({
  businesses,
  links,
  zones,
  introductions,
  canSeeIntros,
  canAddRecords,
  currentUserId,
}: MapViewProps) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [pinDropMode, setPinDropMode] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<
    { lat: number; lng: number } | null
  >(null);
  const [lastSector, setLastSector] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!pinDropMode) return;
      setPendingCoords(coords);
      setDialogOpen(true);
    },
    [pinDropMode],
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
            businesses={businesses}
            links={links}
            zones={zones}
            introductions={introductions}
            filter={filter}
            showIntros={canSeeIntros}
            pinDropMode={pinDropMode && canAddRecords}
            onMapClick={handleMapClick}
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
              {businesses.length} businesses · {links.length} links
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              {introductions.length} intros · {zones.length} zones
            </p>
          </Card>

          {businesses.slice(0, 5).map((b) => (
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
          {businesses.length === 0 ? (
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
    </div>
  );
}
