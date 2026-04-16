import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/ops/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Wrapper class for the label/input/hint stack. */
  containerClassName?: string;
};

/**
 * Text input with optional label, hint, and inline error message. The visual
 * style matches the rest of the ops portal — flat, square corners, ink-on-paper
 * with a sector-music red error state.
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
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-mute"
        >
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          "relative flex items-center border border-zimx-line bg-zimx-paper transition-colors",
          "focus-within:border-zimx-ink",
          error && "border-sector-music focus-within:border-sector-music",
          disabled && "opacity-60 bg-zimx-offwhite",
        )}
      >
        {leadingIcon ? (
          <span className="pl-3 text-zimx-mute inline-flex">{leadingIcon}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full bg-transparent px-3 py-2.5 text-[14px] text-zimx-ink placeholder:text-zimx-mute",
            "outline-none focus:outline-none",
            leadingIcon && "pl-2",
            trailingIcon && "pr-2",
            className,
          )}
          {...rest}
        />
        {trailingIcon ? (
          <span className="pr-3 text-zimx-mute inline-flex">{trailingIcon}</span>
        ) : null}
      </div>

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

export default Input;
