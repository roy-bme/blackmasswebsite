import type { Metadata } from "next";

// The /indaba URL space is served exclusively on the indaba.zimx.io hostname
// via hostname-based middleware rewrites. Robots are blocked both here (via
// metadata) and at the edge (via the X-Robots-Tag header in middleware).
export const metadata: Metadata = {
  metadataBase: new URL("https://indaba.zimx.io"),
  title: {
    default: "Indaba — Blackmass Operations",
    template: "%s — Indaba",
  },
  description: "Internal operations portal for Blackmass Enterprises Ltd.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Indaba — Blackmass Operations",
    description: "Internal operations portal for Blackmass Enterprises Ltd.",
  },
};

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Portal chrome (sidebar/topbar, session-aware nav) lands here in Phase 3.
  // Kept minimal for now so Phase 0 stays visually neutral.
  return <div className="min-h-screen">{children}</div>;
}
