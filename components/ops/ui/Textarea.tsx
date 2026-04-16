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
          className="font-mono text-[11px] uppercase tracking-tag text-zinc-500"
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
          "w-full border border-zinc-200 bg-white px-3 py-2.5 text-[14px] text-zimx-black",
          "placeholder:text-zinc-500 resize-y outline-none focus:outline-none",
          "focus:border-zimx-black transition-colors",
          error && "border-zimx-red focus:border-zimx-red",
          disabled && "opacity-60 bg-zimx-offwhite",
          className,
        )}
        {...rest}
      />

      {error ? (
        <p
          id={errorId}
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
