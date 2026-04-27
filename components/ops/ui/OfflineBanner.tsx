"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/ops/cn";

type OfflineBannerProps = {
  /** Number of mutations queued for retry on reconnect. */
  queued?: number;
  className?: string;
};

/**
 * Persistent warn-tone banner shown at the top of mobile views when the
 * `navigator.onLine` flag flips false. Surfaces the queued-submission count
 * so users know their visit logs aren't lost.
 *
 * Renders nothing while online — no DOM cost when connectivity is fine.
 */
export default function OfflineBanner({
  queued = 0,
  className,
}: OfflineBannerProps) {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setOnline(navigator.onLine);
    }
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 border border-status-warn bg-status-warn/[0.06] px-4 py-3",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-status-warn"
      >
        <path d="M5 12.5a8 8 0 0114 0M8 16a4 4 0 018 0M12 19h0" />
      </svg>
      <div className="flex-1">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-status-warn">
          offline
        </p>
        <p className="mt-0.5 text-[13px] text-white">
          Showing cached data. Submissions queued — will sync on reconnect.
        </p>
      </div>
      {queued > 0 ? (
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
          {queued} queued
        </span>
      ) : null}
    </div>
  );
}
