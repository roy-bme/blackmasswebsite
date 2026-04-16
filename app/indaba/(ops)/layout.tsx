import type { Metadata } from "next";
import { redirect } from "next/navigation";

import OpsShell from "@/components/ops/OpsShell";
import { loadOpsProfile } from "@/lib/ops/auth";

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

/**
 * Ops portal layout.
 *
 * Guarantees that every descendant route renders with a signed-in user whose
 * `public.users` row exists and is active. Middleware already blocks
 * anonymous traffic; this second check covers the edge case where the
 * Supabase auth user exists but the corresponding row in `public.users` is
 * missing or deactivated (orphan / disabled account).
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await loadOpsProfile();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  if (result.status === "orphan") {
    redirect("/auth/auth-error?reason=profile_not_provisioned");
  }
  if (result.status === "disabled") {
    redirect("/auth/auth-error?reason=account_disabled");
  }
  if (result.status === "error") {
    redirect("/auth/auth-error?reason=profile_lookup_failed");
  }

  return <OpsShell user={result.user}>{children}</OpsShell>;
}
