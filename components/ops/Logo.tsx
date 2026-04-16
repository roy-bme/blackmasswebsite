import { cn } from "@/lib/ops/cn";

type Variant = "light" | "dark";
type Size = "sm" | "md" | "lg";

type Props = {
  /** `light` for dark backgrounds (white mark), `dark` for light backgrounds (charcoal mark). */
  variant?: Variant;
  size?: Size;
  /** Hide the wordmark and render only the glyph. */
  glyphOnly?: boolean;
  className?: string;
  /** Optional accessible label override; defaults to "Indaba — Blackmass". */
  label?: string;
};

const SIZES: Record<Size, { wrapper: string; glyph: number; word: string }> = {
  sm: { wrapper: "gap-2", glyph: 20, word: "text-[14px]" },
  md: { wrapper: "gap-2.5", glyph: 28, word: "text-[18px]" },
  lg: { wrapper: "gap-3", glyph: 40, word: "text-[24px]" },
};

/**
 * Placeholder Indaba mark used across the ops portal.
 *
 * The glyph is a rotated square ("indaba" = a gathering, drawn as a meeting
 * point of four corners) with the sector accent rail beneath it. Replace
 * with the final ZimX-supplied SVG when artwork lands; the public API of
 * this component (variant, size, glyphOnly) is the contract Phase 5+ relies
 * on, so keep it stable.
 */
export default function Logo({
  variant = "light",
  size = "md",
  glyphOnly = false,
  className,
  label = "Indaba — Blackmass",
}: Props) {
  const dims = SIZES[size];
  const isLight = variant === "light";
  const markFill = isLight ? "#ffffff" : "#1f2228";
  const markStroke = isLight ? "#ffffff" : "#1f2228";
  const wordColor = isLight ? "text-white" : "text-zimx-ink";

  return (
    <span
      className={cn(
        "inline-flex items-center select-none",
        dims.wrapper,
        className,
      )}
      aria-label={label}
      role="img"
    >
      <svg
        width={dims.glyph}
        height={dims.glyph}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Outer rotated square — the "gathering". */}
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          transform="rotate(45 20 20)"
          stroke={markStroke}
          strokeWidth="2"
          fill="none"
        />
        {/* Inner dot — the meeting point. */}
        <circle cx="20" cy="20" r="4" fill={markFill} />
        {/* Sector accent rail across the bottom — five ventures, five colours. */}
        <g>
          <rect x="4" y="36" width="6" height="2" fill="#1f5fa6" />
          <rect x="11" y="36" width="6" height="2" fill="#6d28d9" />
          <rect x="18" y="36" width="6" height="2" fill="#c9a55a" />
          <rect x="25" y="36" width="6" height="2" fill="#be123c" />
          <rect x="32" y="36" width="4" height="2" fill="#c2410c" />
        </g>
      </svg>

      {!glyphOnly && (
        <span
          className={cn(
            "font-mono font-light tracking-[2px] uppercase leading-none",
            dims.word,
            wordColor,
          )}
        >
          indaba
        </span>
      )}
    </span>
  );
}
