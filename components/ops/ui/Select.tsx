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
  /** Render-friendly options. If omitted, you can pass `children` instead. */
  options?: SelectOption[];
  /** Pass-through children (custom `<option>` / `<optgroup>` markup). */
  children?: React.ReactNode;
  /** Optional placeholder rendered as a disabled, empty-value first option. */
  placeholder?: string;
  containerClassName?: string;
};

/**
 * Native `<select>` styled to match the rest of the ops portal. Native is the
 * right call here — accessibility, keyboard, and mobile UX all come for free,
 * and the design system doesn't need a custom popover yet.
 */
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
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-mute"
        >
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          "relative border border-zimx-line bg-zimx-paper transition-colors",
          "focus-within:border-zimx-ink",
          error && "border-sector-music focus-within:border-sector-music",
          disabled && "opacity-60 bg-zimx-offwhite",
        )}
      >
        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full appearance-none bg-transparent px-3 py-2.5 pr-9 text-[14px] text-zimx-ink",
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
        {/* Caret — flat, monochrome to match the ink-on-paper aesthetic. */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zimx-mute"
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

export default Select;
