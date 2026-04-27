import { cn } from "@/lib/ops/cn";

type IndabaLogoProps = {
  size?: number;
  className?: string;
  /** Hide the wordmark and render only the glyph. */
  glyphOnly?: boolean;
  label?: string;
};

/**
 * Indaba mark — three white horizontal bars + a gold diagonal slash. Source
 * SVG mirrors `components.jsx → ZimXMark` from the design handoff bundle.
 */
export default function IndabaLogo({
  size = 18,
  className,
  glyphOnly = false,
  label = "ZimX — Indaba",
}: IndabaLogoProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-2 select-none", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="5" width="18" height="2" fill="currentColor" />
        <rect x="3" y="11" width="18" height="2" fill="currentColor" />
        <rect x="3" y="17" width="18" height="2" fill="currentColor" />
        <path
          d="M5 21 L19 3"
          stroke="#D4AF37"
          strokeWidth="2.2"
          strokeLinecap="square"
        />
      </svg>
      {!glyphOnly ? (
        <span
          className="font-mono font-semibold leading-none"
          style={{ fontSize: Math.max(11, size - 4), letterSpacing: "0.18em" }}
        >
          ZIMX
        </span>
      ) : null}
    </span>
  );
}
