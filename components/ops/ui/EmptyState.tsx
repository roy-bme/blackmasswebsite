import type { ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type EmptyStateProps = {
  /** Optional decorative icon (SVG or emoji span). Renders above the title. */
  icon?: ReactNode;
  /** Short eyebrow line above the title — typically a section label. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Primary CTA — e.g. <Button href="/indaba/projects/new">New project</Button> */
  action?: ReactNode;
  /** Optional secondary action rendered next to the primary one. */
  secondaryAction?: ReactNode;
  className?: string;
};

/**
 * Empty-state surface used by lists, search results, and not-yet-populated
 * dashboards. Always shows the indaba tagline footer so users have a quiet
 * reminder of the product's purpose even when there's nothing to look at.
 */
export default function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center text-zinc-500">
          {icon}
        </div>
      ) : null}

      {eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
          {eyebrow}
        </p>
      ) : null}

      <h3 className="mt-2 font-mono text-[18px] uppercase tracking-tag text-zimx-black">
        {title}
      </h3>

      {description ? (
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}

      <p className="mt-10 border-t border-zinc-200 pt-4 font-mono text-[10px] uppercase tracking-tag text-zinc-500">
        indaba — a gathering where business is discussed
      </p>
    </div>
  );
}
