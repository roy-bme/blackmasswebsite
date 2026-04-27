import type { ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type EmptyStateProps = {
  /** Optional decorative icon (SVG or emoji span). Renders above the title. */
  icon?: ReactNode;
  /** Short eyebrow line above the title — typically a section label. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Primary CTA. */
  action?: ReactNode;
  /** Optional secondary action rendered next to the primary one. */
  secondaryAction?: ReactNode;
  className?: string;
};

/**
 * Empty-state surface — dashed line-15 border, mono "EMPTY" eyebrow, 14px
 * headline, 12px fg.mute body. Matches `screens/modules.jsx` empty-state
 * patterns for compliance, directory lanes, etc.
 */
export default function EmptyState({
  icon,
  eyebrow = "empty",
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start border border-dashed border-line-15 bg-transparent px-4 py-5",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 inline-flex h-8 w-8 items-center justify-center text-fg-dim">
          {icon}
        </div>
      ) : null}

      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-[14px] font-medium text-white">{title}</h3>

      {description ? (
        <p className="mt-1 max-w-md text-[12px] leading-relaxed text-fg-mute">
          {description}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
