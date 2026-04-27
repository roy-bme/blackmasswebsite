"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type ToastTone = "ok" | "warn" | "bad" | "info";

type ToastProps = {
  tone?: ToastTone;
  /** Single-line headline — usually a result confirmation. */
  message: ReactNode;
  /** Optional gold "UNDO" link aligned right. */
  onUndo?: () => void;
  className?: string;
};

const ICON: Record<ToastTone, ReactNode> = {
  ok: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  warn: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4M12 17h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  bad: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 8v4M12 16h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

const TONE_CLASS: Record<ToastTone, string> = {
  ok: "text-status-ok",
  warn: "text-status-warn",
  bad: "text-status-bad",
  info: "text-status-info",
};

/**
 * Toast — bg ink-600, status icon, optional gold UNDO link aligned right.
 * The Toast component is presentational only; queueing/timeouts live in the
 * caller (see `lib/ops/flash.ts` and any future toast provider).
 */
export default function Toast({
  tone = "ok",
  message,
  onUndo,
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex w-full items-center gap-3 bg-ink-600 px-4 py-3",
        className,
      )}
    >
      <span className={TONE_CLASS[tone]}>{ICON[tone]}</span>
      <span className="text-[13px] text-white">{message}</span>
      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="ml-auto font-mono text-[10px] uppercase tracking-eyebrow text-zimx-gold hover:text-zimx-gold-muted"
        >
          undo
        </button>
      ) : null}
    </div>
  );
}
