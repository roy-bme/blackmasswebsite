import type { ReactNode } from "react";

export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-6 md:px-10 lg:px-12 mx-auto w-full max-w-[1600px] ${className}`}
    >
      {children}
    </div>
  );
}
