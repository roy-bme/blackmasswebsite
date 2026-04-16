import DirectoryView from "@/components/ops/Directory/DirectoryView";
import type {
  DirectoryBusiness,
  DirectoryZone,
} from "@/components/ops/Directory/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Zone } from "@/types/ops";

type DirectoryPageProps = {
  searchParams: { id?: string };
};

export default async function DirectoryPage({
  searchParams,
}: DirectoryPageProps) {
  const user = await requireModuleAccess("/indaba/directory");
  const supabase = createSupabaseServerClient();

  const [businessesRes, zonesRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .order("name", { ascending: true }),
    supabase.from("zones").select("id, name").order("name"),
  ]);

  const zoneRows = (zonesRes.data ?? []) as Pick<Zone, "id" | "name">[];
  const zoneNameById = new Map(zoneRows.map((z) => [z.id, z.name]));

  const businesses: DirectoryBusiness[] = (
    (businessesRes.data ?? []) as Business[]
  ).map((b) => ({
    ...b,
    zone_name: b.zone_id ? zoneNameById.get(b.zone_id) ?? null : null,
  }));

  const zones: DirectoryZone[] = zoneRows;

  const canEdit = user.role === "admin" || user.role === "ops";
  const canSeeContacts = user.role === "admin" || user.role === "bd";

  return (
    <DirectoryView
      businesses={businesses}
      zones={zones}
      currentUserId={user.id}
      currentUserRole={user.role}
      canEdit={canEdit}
      canSeeContacts={canSeeContacts}
      initialOpenId={searchParams.id ?? null}
    />
  );
}
