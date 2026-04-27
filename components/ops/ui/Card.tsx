import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

const PADDING: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3.5",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
};

export type CardAccent = "gold" | "ok" | "warn" | "bad" | "info";

const ACCENTS: Record<CardAccent, string> = {
  gold: "border-l-2 border-l-zimx-gold",
  ok: "border-l-2 border-l-status-ok",
  warn: "border-l-2 border-l-status-warn",
  bad: "border-l-2 border-l-status-bad",
  info: "border-l-2 border-l-status-info",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  /** Render with no background — for cards on a transparent surface. */
  bare?: boolean;
  /** Optional 2px coloured left stripe — see ACCENTS map. */
  accent?: CardAccent;
  /** Subtle hover state, for cards that act as buttons. */
  interactive?: boolean;
};

/**
 * Indaba card — flat ink-800 surface with hairline border, optional gold/ok
 * left stripe. Header / Body / Footer sections layered with hairline dividers.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = "md", bare, accent, interactive, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "border border-line-10",
        bare ? "bg-transparent" : "bg-ink-800",
        accent && ACCENTS[accent],
        PADDING[padding],
        interactive && "transition-colors hover:bg-ink-700 cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

type SectionProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

const CardHeader = forwardRef<HTMLDivElement, SectionProps>(function CardHeader(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line-10 px-4 py-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

const CardBody = forwardRef<HTMLDivElement, SectionProps>(function CardBody(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("px-4 py-4", className)} {...rest}>
      {children}
    </div>
  );
});

const CardFooter = forwardRef<HTMLDivElement, SectionProps>(function CardFooter(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-2 border-t border-line-10 px-4 py-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, children, ...rest }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-mono text-[11px] uppercase tracking-eyebrow text-fg-dim",
        className,
      )}
      {...rest}
    >
      {children}
    </h3>
  );
});

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, children, ...rest }, ref) {
  return (
    <p
      ref={ref}
      className={cn("mt-1 text-[13px] text-fg-mute", className)}
      {...rest}
    >
      {children}
    </p>
  );
});

type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
};

const CardWithSlots = Card as CardComponent;
CardWithSlots.Header = CardHeader;
CardWithSlots.Body = CardBody;
CardWithSlots.Footer = CardFooter;
CardWithSlots.Title = CardTitle;
CardWithSlots.Description = CardDescription;

export default CardWithSlots;
export { CardHeader, CardBody, CardFooter, CardTitle, CardDescription };
