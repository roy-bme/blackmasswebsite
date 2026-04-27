"use client";

import { useState } from "react";

import Button from "@/components/ops/ui/Button";

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
  currentUserId: _currentUserId,
  onEnterPinDrop,
  onExitPinDrop,
  onToggleQuickAdd,
}: MapActionsProps) {
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      {pinDropMode ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-3 z-[600] flex justify-center px-3"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 border border-zimx-gold bg-ink-900/95 px-4 py-2 text-white shadow-lg">
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-zimx-gold">
              Tap the map to drop a pin
            </span>
            <label className="flex items-center gap-2 border-l border-line-15 pl-3 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              <input
                type="checkbox"
                checked={quickAddMode}
                onChange={onToggleQuickAdd}
                className="h-3.5 w-3.5 accent-zimx-gold"
              />
              Quick-add
            </label>
            <button
              type="button"
              onClick={onExitPinDrop}
              aria-label="Cancel pin-drop"
              className="inline-flex h-6 w-6 items-center justify-center border border-line-15 bg-white/5 text-[12px] leading-none text-white hover:border-line-30"
            >
              {"✕"}
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onEnterPinDrop}
            leadingIcon={<PlusIcon />}
          >
            Drop pin
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinkOpen(true)}
            leadingIcon={<PlusIcon />}
          >
            Log link
          </Button>
        </div>
      )}

      <AddLinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        businesses={businesses}
      />
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
