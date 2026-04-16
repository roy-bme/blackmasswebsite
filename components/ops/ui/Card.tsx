import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  /** Drop the default white surface — use the parent's background. */
  bare?: boolean;
  /** Subtle hover lift, for clickable cards. */
  interactive?: boolean;
};

/**
 * Card surface — a flat, square-cornered container that matches the rest of
 * the ops portal's "no rounded corners" rule. Use Card.Header / Card.Body /
 * Card.Footer for vertical structure when you need explicit dividers.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = "md", bare, interactive, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "border border-zimx-line",
        bare ? "bg-transparent" : "bg-zimx-paper",
        PADDING[padding],
        interactive &&
          "transition-shadow hover:shadow-[0_2px_0_0_rgba(31,34,40,1)] cursor-pointer",
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
        "flex items-start justify-between gap-4 border-b border-zimx-line px-6 py-4",
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
    <div ref={ref} className={cn("px-6 py-5", className)} {...rest}>
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
        "flex items-center justify-end gap-3 border-t border-zimx-line px-6 py-4",
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
        "font-mono text-[14px] uppercase tracking-tag text-zimx-ink",
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
      className={cn("mt-1 text-[13px] text-zimx-mute", className)}
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
