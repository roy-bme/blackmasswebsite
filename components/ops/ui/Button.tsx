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
  | "solid"
  | "ghost"
  | "bare"
  | "danger"
  | "secondary"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-mono uppercase " +
  "tracking-eyebrow leading-none whitespace-nowrap rounded-none " +
  "transition-colors select-none disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  // Gold primary — main calls to action throughout the portal.
  primary:
    "bg-zimx-gold text-[#1a1612] border border-zimx-gold hover:bg-zimx-gold-muted hover:border-zimx-gold-muted",
  solid:
    "bg-white text-ink-700 border border-white hover:bg-white/90",
  // Ghost = transparent with hairline border. The default cool action.
  ghost:
    "bg-transparent text-white border border-line-20 hover:border-line-30 hover:bg-white/5",
  // Bare = no border, just text — for tertiary "Skip" / "Cancel" actions.
  bare:
    "bg-transparent text-fg-mute border border-transparent hover:text-white",
  danger:
    "bg-transparent text-status-bad border border-status-bad/35 hover:bg-status-bad/10",
  // Legacy aliases kept so older marketing buttons continue to work.
  secondary:
    "bg-ink-600 text-white border border-line-15 hover:bg-ink-500",
  outline:
    "bg-transparent text-white border border-line-20 hover:bg-white/5",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-[11px]",
  md: "px-4 py-2.5 text-[12px]",
  lg: "px-5 py-3.5 text-[13px]",
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
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "ghost",
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
