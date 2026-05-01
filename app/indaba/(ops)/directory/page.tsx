import DirectoryClient from "./DirectoryClient";

import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, DiscoveryCandidate } from "@/types/ops";

export const dynamic = "force-dynamic";

type BizLite = Pick<
  Business,
  | "id"
  | "name"
  | "sector"
  | "onboarding_stage"
  | "launch_6"
  | "address"
  | "zone_id"
  | "est_monthly_volume"
  | "notes"
  | "mapped_by"
  | "created_at"
>;

export default async function DirectoryPage() {
  const user = await requireModuleAccess("/indaba/directory");
  const supabase = createSupabaseServerClient();

  const [businessesRes, candidatesRes, zonesRes, usersRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, onboarding_stage, launch_6, address, zone_id, est_monthly_volume, notes, mapped_by, created_at")
      .order("name"),
    supabase.from("discovery_candidates").select("*").eq("status", "open").order("confidence", { ascending: false }).limit(20),
    supabase.from("zones").select("id, name, centre_lat, centre_lng").order("name"),
    supabase.from("users").select("id, name").order("name"),
  ]);

  return (
    <DirectoryClient
      businesses={(businessesRes.data ?? []) as BizLite[]}
      suggested={(candidatesRes.data ?? []) as DiscoveryCandidate[]}
      zones={(zonesRes.data ?? []) as Array<{ id: string; name: string; centre_lat: number | null; centre_lng: number | null }>}
      users={(usersRes.data ?? []) as Array<{ id: string; name: string }>}
      role={user.role}
    />
  );
}
