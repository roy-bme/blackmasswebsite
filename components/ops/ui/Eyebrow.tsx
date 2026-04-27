import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type EyebrowProps = HTMLAttributes<HTMLDivElement> & {
  /** Switch to gold for "needs attention" / agent-discovered surfaces. */
  gold?: boolean;
  /** Render inline as a span instead of a block div. */
  inline?: boolean;
  children: ReactNode;
};

/**
 * Mono uppercase 11px label with 0.14em tracking. Sits above section titles
 * and as the "INDABA / SIGN IN" breadcrumb on auth surfaces.
 */
export default function Eyebrow({
  gold,
  inline,
  className,
  children,
  ...rest
}: EyebrowProps) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={cn(
        "font-mono text-[11px] uppercase tracking-eyebrow leading-none",
        gold ? "text-zimx-gold" : "text-fg-dim",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
