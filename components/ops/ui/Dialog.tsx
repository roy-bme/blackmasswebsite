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
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

/**
 * Modal dialog — dark ink-800 surface, hairline border, no radius. Rendered
 * into a portal on document.body. Used for desktop confirmation flows; the
 * mobile equivalent for sheets is `BottomSheet`.
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

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      className="fixed inset-0 flex items-center justify-center bg-ink-900/70 p-4"
      style={{ zIndex: 1000 }}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "relative w-full bg-ink-800 border border-line-15 text-white",
          "max-h-[90vh] overflow-y-auto",
          SIZES[size],
          className,
        )}
        style={{ zIndex: 1001 }}
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
        "flex items-start justify-between gap-4 border-b border-line-10 px-5 py-4",
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
        "font-mono text-[12px] uppercase tracking-eyebrow text-white",
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
    <div
      className={cn("px-5 py-5 text-[13px] text-white", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function DialogFooter({ className, children, ...rest }: SectionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-line-10 px-5 py-4",
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
      className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute hover:text-white"
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
