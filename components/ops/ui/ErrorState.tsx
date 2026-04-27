import type { ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type ErrorStateProps = {
  /** Eyebrow code — defaults to "error". Pair with the HTTP code (e.g. "502"). */
  code?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Error surface — bad/30 border, bad/06 bg, mono "ERROR · code" eyebrow, retry
 * button. Used inline whenever a server fetch fails on the client.
 */
export default function ErrorState({
  code,
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border border-status-bad/30 bg-status-bad/[0.06] px-4 py-4",
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-status-bad">
        error{code ? ` · ${code}` : ""}
      </p>
      <p className="mt-2 text-[14px] font-medium text-white">{title}</p>
      {description ? (
        <p className="mt-1 text-[12px] text-fg-mute">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
