import { cache } from "react";
import { redirect } from "next/navigation";

import { canAccess } from "@/lib/ops/nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/ops";

export type OpsUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type OpsProfileResult =
  | { status: "ok"; user: OpsUser }
  | { status: "unauthenticated" }
  /** Auth user exists but the corresponding `public.users` row is missing. */
  | { status: "orphan" }
  /** Row exists but has been deactivated. */
  | { status: "disabled" }
  | { status: "error"; reason: string };

/**
 * Canonical way to read the current signed-in ops user.
 *
 * Wrapped in `React.cache` so that a single request rendering the `(ops)`
 * layout + a module page share one Supabase round-trip. Returns a
 * discriminated result so callers can choose between redirecting to `/login`,
 * the auth-error surface, or proceeding with the profile.
 */
export const loadOpsProfile = cache(async (): Promise<OpsProfileResult> => {
  const supabase = createSupabaseServerClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    return { status: "error", reason: error.message };
  }

  if (!data) {
    return { status: "orphan" };
  }

  const row = data as {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    active: boolean;
  };

  if (!row.active) {
    return { status: "disabled" };
  }

  return {
    status: "ok",
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    },
  };
});

/**
 * Module-page gate: returns the current user, or redirects to
 * `/indaba/dashboard` with a flash message if the user's role can't access
 * `href`. Relies on the layout to have already enforced authentication;
 * still defends against direct calls by bouncing to `/login` if the session
 * has vanished between the layout and this page.
 */
export async function requireModuleAccess(href: string): Promise<OpsUser> {
  const result = await loadOpsProfile();

  if (result.status !== "ok") {
    // Layout normally catches this; belt-and-braces for direct imports.
    redirect("/login");
  }

  if (!canAccess(result.user.role, href)) {
    const flash = encodeURIComponent(
      "You don't have access to that module.",
    );
    redirect(`/indaba/dashboard?flash=${flash}`);
  }

  return result.user;
}
