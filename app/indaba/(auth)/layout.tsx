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
  // Auth surfaces own their full-bleed layout — no portal chrome.
  return <>{children}</>;
}
