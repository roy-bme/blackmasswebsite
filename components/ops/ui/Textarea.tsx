import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

/**
 * Multiline text input. Mirrors the visual contract of `Input` so the two
 * compose cleanly inside the same form.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    containerClassName,
    className,
    id,
    rows = 4,
    disabled,
    ...rest
  },
  ref,
) {
  const fieldId = id ?? rest.name;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-mute"
        >
          {label}
        </label>
      ) : null}

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId ?? hintId}
        className={cn(
          "w-full border border-zimx-line bg-zimx-paper px-3 py-2.5 text-[14px] text-zimx-ink",
          "placeholder:text-zimx-mute resize-y outline-none focus:outline-none",
          "focus:border-zimx-ink transition-colors",
          error && "border-sector-music focus:border-sector-music",
          disabled && "opacity-60 bg-zimx-offwhite",
          className,
        )}
        {...rest}
      />

      {error ? (
        <p
          id={errorId}
          className="font-mono text-[11px] uppercase tracking-tag text-sector-music"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] text-zimx-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
