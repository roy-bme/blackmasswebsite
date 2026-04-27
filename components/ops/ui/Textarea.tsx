import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

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
          className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim"
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
          "w-full border border-line-15 bg-ink-700 px-3 py-2.5 text-[14px] text-white",
          "placeholder:text-fg-faint resize-y outline-none focus:outline-none",
          "focus:border-zimx-gold transition-colors",
          error && "border-status-bad focus:border-status-bad",
          disabled && "opacity-60",
          className,
        )}
        {...rest}
      />

      {error ? (
        <p
          id={errorId}
          className="font-mono text-[10px] uppercase tracking-eyebrow text-status-bad"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-fg-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
