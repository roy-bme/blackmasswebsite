import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Root metadata is intentionally minimal. Each route group (marketing / ops /
// auth) overrides title, description, and OpenGraph details in its own layout
// so that the public marketing site and the private indaba portal get correct
// metadata and robots rules without cross-contamination.
export const metadata: Metadata = {
  title: {
    default: "Blackmass",
    template: "%s — Blackmass",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2228",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-ink text-white font-sans antialiased">{children}</body>
    </html>
  );
}
