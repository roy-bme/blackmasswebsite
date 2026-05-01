import DirectoryClient from "./DirectoryClient";

import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DiscoveryCandidate } from "@/types/ops";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const user = await requireModuleAccess("/indaba/directory");
  const supabase = createSupabaseServerClient();

  const [candidatesRes, zonesRes, usersRes] = await Promise.all([
    supabase.from("discovery_candidates").select("*").eq("status", "open").order("confidence", { ascending: false }).limit(20),
    supabase.from("zones").select("id, name, centre_lat, centre_lng").order("name"),
    supabase.from("users").select("id, name").order("name"),
  ]);

  return (
    <DirectoryClient
      suggested={(candidatesRes.data ?? []) as DiscoveryCandidate[]}
      zones={(zonesRes.data ?? []) as Array<{ id: string; name: string; centre_lat: number | null; centre_lng: number | null }>}
      users={(usersRes.data ?? []) as Array<{ id: string; name: string }>}
      role={user.role}
    />
  );
}
