import type { Metadata } from "next";
import { redirect } from "next/navigation";

import OpsShell from "@/components/ops/OpsShell";
import { loadOpsProfile } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
 * Ops portal layout. Pulls the role-aware nav badges (unread feed, open
 * compliance flags, pending intros) once at the layout level so OpsShell can
 * render them consistently across every module page.
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

  if (result.user.passwordChangeRequired) {
    redirect("/auth/change-password");
  }

  const supabase = createSupabaseServerClient();
  const role = result.user.role;

  // Counts the shell uses to show notification dots. Each `select head:true`
  // is a single round-trip; failures fall back to undefined so the shell just
  // hides the dot rather than blocking the layout.
  const [feedRes, complianceRes, introsRes] = await Promise.all([
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true }),
    role === "admin" || role === "compliance"
      ? supabase
          .from("compliance_flags")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
      : Promise.resolve({ count: 0 }),
    role === "admin"
      ? supabase
          .from("introductions")
          .select("id", { count: "exact", head: true })
          .eq("roy_approved", false)
      : Promise.resolve({ count: 0 }),
  ]);

  const badges = {
    feed: feedRes.count ?? undefined,
    compliance:
      "count" in complianceRes ? complianceRes.count ?? undefined : undefined,
    intros: "count" in introsRes ? introsRes.count ?? undefined : undefined,
  };

  return (
    <OpsShell user={result.user} badges={badges}>
      {children}
    </OpsShell>
  );
}
