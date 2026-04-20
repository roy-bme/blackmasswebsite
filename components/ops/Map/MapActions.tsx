"use client";

import { useState } from "react";

import AddLinkDialog from "./AddLinkDialog";
import type { MapBusiness } from "./types";

type MapActionsProps = {
  pinDropMode: boolean;
  quickAddMode: boolean;
  businesses: MapBusiness[];
  currentUserId: string;
  onEnterPinDrop: () => void;
  onExitPinDrop: () => void;
  onToggleQuickAdd: () => void;
};

export default function MapActions({
  pinDropMode,
  quickAddMode,
  businesses,
  currentUserId,
  onEnterPinDrop,
  onExitPinDrop,
  onToggleQuickAdd,
}: MapActionsProps) {
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      {pinDropMode ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-3 z-[600] flex justify-center px-3"
            role="status"
            aria-live="polite"
          >
            <div
              className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-lg px-4 py-2 text-white shadow-lg"
              style={{ backgroundColor: "#1A3A2E" }}
            >
              <span className="text-[13px] leading-snug">
                Tap the map where the business is located.
              </span>
              <label className="flex items-center gap-2 border-l border-white/30 pl-3 font-mono text-[11px] uppercase tracking-tag">
                <input
                  type="checkbox"
                  checked={quickAddMode}
                  onChange={onToggleQuickAdd}
                  className="h-3.5 w-3.5 accent-white"
                />
                Quick-add
              </label>
              <button
                type="button"
                onClick={onExitPinDrop}
                aria-label="Cancel pin-drop"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[14px] leading-none text-white hover:bg-white/25"
              >
                {"\u2715"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
          <button
            type="button"
            onClick={onEnterPinDrop}
            className="inline-flex items-center gap-1.5 border border-zimx-black bg-zimx-black px-4 py-3 font-mono text-[11px] uppercase tracking-button text-white shadow-lg transition-colors hover:bg-zinc-800"
          >
            + Add business
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-button text-zimx-black shadow-lg transition-colors hover:bg-zinc-50"
          >
            + Log link
          </button>
        </div>
      )}

      <AddLinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        businesses={businesses}
        currentUserId={currentUserId}
      />
    </>
  );
}
