"use client";

import { useState } from "react";

import AddBusinessDialog from "./AddBusinessDialog";
import AddLinkDialog from "./AddLinkDialog";
import type { MapBusiness, MapZone } from "./types";

type DialogKey = "business" | "link" | null;

type MapActionsProps = {
  zones: MapZone[];
  businesses: MapBusiness[];
  currentUserId: string;
};

export default function MapActions({
  zones,
  businesses,
  currentUserId,
}: MapActionsProps) {
  const [openDialog, setOpenDialog] = useState<DialogKey>(null);

  return (
    <>
      {/* Leaflet controls sit at z-index ~1000; popups at ~700. Stay under
          popups so they don't obscure details, but above the map canvas. */}
      <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpenDialog("business")}
          className="inline-flex items-center gap-1.5 border border-zimx-black bg-zimx-black px-4 py-3 font-mono text-[11px] uppercase tracking-button text-white shadow-lg transition-colors hover:bg-zinc-800"
        >
          + Add business
        </button>
        <button
          type="button"
          onClick={() => setOpenDialog("link")}
          className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-button text-zimx-black shadow-lg transition-colors hover:bg-zinc-50"
        >
          + Log link
        </button>
      </div>

      <AddBusinessDialog
        open={openDialog === "business"}
        onClose={() => setOpenDialog(null)}
        zones={zones}
        currentUserId={currentUserId}
      />
      <AddLinkDialog
        open={openDialog === "link"}
        onClose={() => setOpenDialog(null)}
        businesses={businesses}
        currentUserId={currentUserId}
      />
    </>
  );
}
