import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerClassName?: string;
};

/**
 * Text input with optional label, hint, and inline error message. Dark
 * surface, hairline border, gold focus ring — matches the rest of the
 * indaba portal.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leadingIcon,
    trailingIcon,
    containerClassName,
    className,
    id,
    disabled,
    ...rest
  },
  ref,
) {
  const inputId = id ?? rest.name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim"
        >
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          "relative flex items-center border border-line-15 bg-ink-700 transition-colors",
          "focus-within:border-zimx-gold",
          error && "border-status-bad focus-within:border-status-bad",
          disabled && "opacity-60",
        )}
      >
        {leadingIcon ? (
          <span className="pl-3 text-fg-dim inline-flex">{leadingIcon}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full bg-transparent px-3 py-2.5 text-[14px] text-white placeholder:text-fg-faint",
            "outline-none focus:outline-none",
            leadingIcon && "pl-2",
            trailingIcon && "pr-2",
            className,
          )}
          {...rest}
        />
        {trailingIcon ? (
          <span className="pr-3 text-fg-dim inline-flex">{trailingIcon}</span>
        ) : null}
      </div>

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

export default Input;
