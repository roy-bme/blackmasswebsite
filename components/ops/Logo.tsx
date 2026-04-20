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
  /** Optional accessible label override; defaults to "ZimX — Indaba". */
  label?: string;
};

const SIZES: Record<Size, { wrapper: string; glyph: number; word: string }> = {
  sm: { wrapper: "gap-2", glyph: 22, word: "text-[14px]" },
  md: { wrapper: "gap-2.5", glyph: 30, word: "text-[18px]" },
  lg: { wrapper: "gap-3", glyph: 42, word: "text-[24px]" },
};

/**
 * ZimX mark used across the ops portal.
 *
 * Geometric Z: white top/bottom bars with a gold (zimx-gold) diagonal and
 * three short gold stripes on the top bar's trailing edge. `variant="dark"`
 * swaps the white fills to charcoal for use on light surfaces; the gold
 * accent stays constant.
 */
export default function Logo({
  variant = "light",
  size = "md",
  glyphOnly = false,
  className,
  label = "ZimX — Indaba",
}: Props) {
  const dims = SIZES[size];
  const isLight = variant === "light";
  const barFill = isLight ? "#ffffff" : "#1B1B1B";
  const wordColor = isLight ? "text-white" : "text-zimx-black";
  const accent = "#D4AF37";

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
        <polygon points="5,4 35,4 35,10 5,10" fill={barFill} />
        <polygon points="30,10 35,10 10,30 5,30" fill={accent} />
        <polygon points="5,30 35,30 35,36 5,36" fill={barFill} />
        <rect x="23" y="5" width="9" height="0.8" fill={accent} />
        <rect x="23" y="6.6" width="9" height="0.8" fill={accent} />
        <rect x="23" y="8.2" width="9" height="0.8" fill={accent} />
      </svg>

      {!glyphOnly && (
        <span
          className={cn(
            "font-sans font-semibold tracking-tight leading-none",
            dims.word,
            wordColor,
          )}
        >
          ZimX
        </span>
      )}
    </span>
  );
}
