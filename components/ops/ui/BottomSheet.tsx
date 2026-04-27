"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional aria-label for screen readers when there's no visible title. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Mobile bottom sheet — drag handle, hairline top border, ink-800 bg, slides
 * up from the bottom on open. Uses CSS-only transitions; the panel state is
 * driven by the `open` prop so callers control mount/unmount.
 *
 * Closes on backdrop click or on Escape (handled by the parent via the
 * onClose callback).
 */
export default function BottomSheet({
  open,
  onClose,
  ariaLabel,
  className,
  children,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-40 flex items-end"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/60"
      />
      <div
        className={cn(
          "relative z-10 w-full border-t border-line-15 bg-ink-800",
          "transition-transform duration-200 ease-in-out",
          className,
        )}
      >
        <div className="flex justify-center py-2">
          <span className="block h-[3px] w-9 bg-line-30" />
        </div>
        {children}
      </div>
    </div>
  );
}
