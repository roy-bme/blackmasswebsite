"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/ops/cn";

export type DialogSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

type DialogProps = {
  open: boolean;
  onClose: () => void;
  size?: DialogSize;
  /** Click on the backdrop closes the dialog. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Pressing Escape closes the dialog. Defaults to true. */
  closeOnEscape?: boolean;
  className?: string;
  children: ReactNode;
  /** Optional accessible label; falls back to `aria-labelledby` if Header is present. */
  ariaLabel?: string;
};

/**
 * Lightweight modal dialog rendered into a portal on `document.body`.
 *
 * Built without a third-party headless lib so the ops bundle stays small.
 * Handles: focus trapping (basic — first focusable on open), Escape to close,
 * backdrop click to close, body scroll lock while open, and SSR-safe portal
 * mounting.
 */
export default function Dialog({
  open,
  onClose,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  children,
  ariaLabel,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Escape-to-close.
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closeOnEscape, onClose]);

  // Body scroll lock + initial focus.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel so screen readers and keyboard users land here.
    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!closeOnBackdrop) return;
      if (event.target === event.currentTarget) onClose();
    },
    [closeOnBackdrop, onClose],
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zimx-black/70 p-4"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "relative w-full bg-white border border-zinc-200 shadow-2xl",
          "max-h-[90vh] overflow-y-auto",
          SIZES[size],
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

type SectionProps = HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className, children, ...rest }: SectionProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function DialogTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-mono text-[14px] uppercase tracking-tag text-zimx-black",
        className,
      )}
      {...rest}
    >
      {children}
    </h2>
  );
}

function DialogBody({ className, children, ...rest }: SectionProps) {
  return (
    <div className={cn("px-6 py-5 text-[14px] text-zimx-black", className)} {...rest}>
      {children}
    </div>
  );
}

function DialogFooter({ className, children, ...rest }: SectionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className="font-mono text-[11px] uppercase tracking-tag text-zinc-500 hover:text-zimx-black"
    >
      Close
    </button>
  );
}

Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.CloseButton = DialogCloseButton;
