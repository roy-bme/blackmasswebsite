import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://indaba.zimx.io"),
  title: {
    default: "Sign in — Indaba",
    template: "%s — Indaba",
  },
  description: "Sign in to the Blackmass internal operations portal.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages render on the same dark surface but without portal chrome;
  // Phase 2 will flesh this out with the login form and callback handler.
  return <div className="min-h-screen">{children}</div>;
}
