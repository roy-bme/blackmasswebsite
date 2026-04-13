import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center font-mono text-[14px] uppercase tracking-[1.4px] px-6 py-3 transition-colors select-none";

const variantClasses: Record<Variant, string> = {
  primary: "bg-white text-ink hover:bg-white/90",
  ghost:
    "bg-transparent text-white border border-white/20 hover:bg-white/5",
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

type ButtonLinkProps = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
};

type ButtonButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
    external?: never;
  };

type Props = ButtonLinkProps | ButtonButtonProps;

export default function Button(props: Props) {
  const { variant = "primary", children, className = "", fullWidth } = props;
  const composed = `${baseClasses} ${variantClasses[variant]} ${
    fullWidth ? "w-full" : ""
  } ${className}`.trim();

  if ("href" in props && props.href) {
    const isExternal =
      props.external ??
      (props.href.startsWith("http") || props.href.startsWith("mailto:"));

    if (isExternal) {
      return (
        <a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          className={composed}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={props.href} className={composed}>
        {children}
      </Link>
    );
  }

  const { variant: _v, fullWidth: _fw, className: _c, children: _ch, href: _h, external: _e, ...rest } =
    props as ButtonButtonProps & { href?: undefined; external?: never };
  return (
    <button type={rest.type ?? "button"} className={composed} {...rest}>
      {children}
    </button>
  );
}
