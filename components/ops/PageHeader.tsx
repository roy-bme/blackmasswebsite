import type { ReactNode } from "react";

import Eyebrow from "@/components/ops/ui/Eyebrow";
import { cn } from "@/lib/ops/cn";

type PageHeaderProps = {
  /** Eyebrow line — mono uppercase. e.g. "indaba · directory · pipeline" */
  eyebrow?: string;
  /** Whether the eyebrow renders in gold (used for "needs decision" pages). */
  eyebrowGold?: boolean;
  title: string;
  /** Mono caption rendered under the title. Optional. */
  caption?: string;
  /** Right-aligned action slot — typically buttons or status pills. */
  actions?: ReactNode;
  className?: string;
};

/**
 * Standard module-page header. Sits at the top of every /indaba page below
 * the OpsShell breadcrumb. Mobile-first: title scales from 32px → 40px,
 * actions wrap below on narrow screens.
 */
export default function PageHeader({
  eyebrow,
  eyebrowGold,
  title,
  caption,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-line-10 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6",
        className,
      )}
    >
      <div>
        {eyebrow ? <Eyebrow gold={eyebrowGold}>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-1 text-[28px] font-light leading-none tracking-tight md:text-[32px]">
          {title}
        </h1>
        {caption ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
            {caption}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
