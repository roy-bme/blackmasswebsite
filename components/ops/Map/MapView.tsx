"use client";

import { useCallback, useState } from "react";

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
    <div className="space-y-3">
      <MapFilters
        active={filter}
        onChange={setFilter}
        canSeeContacts={canSeeIntros}
      />

      <div className="relative overflow-hidden rounded-lg border border-zinc-200">
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
            className="pointer-events-none absolute bottom-4 left-1/2 z-[600] -translate-x-1/2 rounded-md bg-zimx-black/90 px-3 py-1.5 text-[12px] text-white shadow-lg"
          >
            {toast}
          </div>
        ) : null}
      </div>

      <MapLegend />

      {canAddRecords ? (
        <AddBusinessDialog
          open={dialogOpen && pendingCoords !== null}
          onClose={handleDialogClose}
          zones={zones}
          currentUserId={currentUserId}
          coords={pendingCoords}
          quickAddMode={quickAddMode}
          lastSector={lastSector}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
