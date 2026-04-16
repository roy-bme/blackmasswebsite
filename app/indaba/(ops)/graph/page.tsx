import GraphView from "@/components/ops/Graph/GraphView";
import type { GraphBusiness } from "@/components/ops/Graph/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Loop, SupplyChainLink } from "@/types/ops";

export default async function GraphPage() {
  const user = await requireModuleAccess("/indaba/graph");
  const supabase = createSupabaseServerClient();

  const [businessesRes, linksRes, loopsRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, launch_6, est_monthly_volume, lat, lng")
      .order("name", { ascending: true }),
    supabase
      .from("supply_chain_links")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("loops")
      .select("*")
      .order("date_detected", { ascending: false }),
  ]);

  const businesses: GraphBusiness[] = (businessesRes.data ?? []) as Pick<
    Business,
    "id" | "name" | "sector" | "launch_6" | "est_monthly_volume" | "lat" | "lng"
  >[];
  const links = (linksRes.data ?? []) as SupplyChainLink[];
  const loops = (loopsRes.data ?? []) as Loop[];

  const isAdmin = user.role === "admin";

  return (
    <GraphView
      businesses={businesses}
      links={links}
      loops={loops}
      isAdmin={isAdmin}
    />
  );
}
