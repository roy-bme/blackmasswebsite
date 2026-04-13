import type { ReactNode } from "react";

export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block font-mono text-[12px] uppercase tracking-[1px] text-white border px-2 py-1"
      style={{ borderColor: "rgba(255,255,255,0.2)" }}
    >
      {children}
    </span>
  );
}
