"use client";

import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/ops/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-button " +
  "transition-colors select-none whitespace-nowrap " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zimx-ink " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-zimx-ink text-white border border-zimx-ink hover:bg-zimx-charcoal",
  secondary:
    "bg-zimx-cream text-zimx-ink border border-zimx-line hover:bg-zimx-offwhite",
  ghost:
    "bg-transparent text-zimx-ink border border-transparent hover:bg-zimx-offwhite",
  outline:
    "bg-transparent text-zimx-ink border border-zimx-ink hover:bg-zimx-ink hover:text-white",
  danger:
    "bg-sector-music text-white border border-sector-music hover:bg-sector-music/90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-5 py-2.5",
  lg: "px-6 py-3 text-[13px]",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "href"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
    /** Force-render as an `<a>` (skip next/link) for external URLs. */
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Ops portal Button.
 *
 * Renders a `<button>` by default, or a `next/link` `<Link>` when `href` is
 * provided. External URLs (or `external` prop) drop to a plain `<a>` with
 * the standard noopener/noreferrer hardening.
 */
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      fullWidth,
      leadingIcon,
      trailingIcon,
      className,
      children,
    } = props;

    const composed = cn(
      BASE,
      VARIANTS[variant],
      SIZES[size],
      fullWidth && "w-full",
      className,
    );

    const inner = (
      <>
        {leadingIcon ? <span className="inline-flex">{leadingIcon}</span> : null}
        <span>{children}</span>
        {trailingIcon ? <span className="inline-flex">{trailingIcon}</span> : null}
      </>
    );

    if ("href" in props && props.href) {
      const {
        href,
        external,
        variant: _v,
        size: _s,
        fullWidth: _fw,
        leadingIcon: _li,
        trailingIcon: _ti,
        className: _c,
        children: _ch,
        ...rest
      } = props;

      const isExternal =
        external ?? (href.startsWith("http") || href.startsWith("mailto:"));

      if (isExternal) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={composed}
            {...rest}
          >
            {inner}
          </a>
        );
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={composed}
          {...rest}
        >
          {inner}
        </Link>
      );
    }

    const {
      variant: _v,
      size: _s,
      fullWidth: _fw,
      leadingIcon: _li,
      trailingIcon: _ti,
      className: _c,
      children: _ch,
      ...rest
    } = props as ButtonAsButton;

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={rest.type ?? "button"}
        className={composed}
        {...rest}
      >
        {inner}
      </button>
    );
  },
);

export default Button;
