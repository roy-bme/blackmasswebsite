import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  containerClassName?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    options,
    children,
    placeholder,
    containerClassName,
    className,
    id,
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

      <div
        className={cn(
          "relative border border-line-15 bg-ink-700 transition-colors",
          "focus-within:border-zimx-gold",
          error && "border-status-bad focus-within:border-status-bad",
          disabled && "opacity-60",
        )}
      >
        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full appearance-none bg-transparent px-3 py-2.5 pr-9 text-[14px] text-white",
            "outline-none focus:outline-none",
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-dim"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
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

export default Select;
