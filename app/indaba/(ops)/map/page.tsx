import "leaflet/dist/leaflet.css";

import MapView from "@/components/ops/Map/MapView";
import type {
  MapBusiness,
  MapIntroduction,
  MapLink,
  MapZone,
} from "@/components/ops/Map/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Business,
  Introduction,
  SupplyChainLink,
  User,
  Zone,
} from "@/types/ops";

type BusinessRow = Pick<
  Business,
  | "id"
  | "name"
  | "sector"
  | "zone_id"
  | "lat"
  | "lng"
  | "est_monthly_volume"
  | "launch_6"
  | "notes"
>;

type LinkRow = Pick<
  SupplyChainLink,
  | "id"
  | "supplier_id"
  | "buyer_id"
  | "product"
  | "est_monthly_volume"
  | "payment_frequency"
>;

type ZoneRow = Pick<Zone, "id" | "name" | "centre_lat" | "centre_lng">;

type IntroductionRow = Pick<
  Introduction,
  | "id"
  | "contact_name"
  | "role"
  | "business"
  | "business_id"
  | "warmth"
  | "introduced_by"
>;

type UserRow = Pick<User, "id" | "name">;

type DataOnly<T> = { data: T[] | null };

export default async function MapPage() {
  const user = await requireModuleAccess("/indaba/map");
  const supabase = createSupabaseServerClient();

  const canSeeIntros = user.role === "admin" || user.role === "bd";
  const canAddRecords = user.role === "admin" || user.role === "ops";

  const [businessesRes, linksRes, zonesRes, introductionsRes, usersRes] =
    await Promise.all([
      supabase
        .from("businesses")
        .select(
          "id, name, sector, zone_id, lat, lng, est_monthly_volume, launch_6, notes",
        ),
      supabase
        .from("supply_chain_links")
        .select(
          "id, supplier_id, buyer_id, product, est_monthly_volume, payment_frequency",
        ),
      supabase.from("zones").select("id, name, centre_lat, centre_lng"),
      canSeeIntros
        ? supabase
            .from("introductions")
            .select(
              "id, contact_name, role, business, business_id, warmth, introduced_by",
            )
        : (Promise.resolve({ data: [] as IntroductionRow[] }) as Promise<
            DataOnly<IntroductionRow>
          >),
      supabase.from("users").select("id, name"),
    ]);

  const businessRows = (businessesRes.data ?? []) as BusinessRow[];
  const linkRows = (linksRes.data ?? []) as LinkRow[];
  const zoneRows = (zonesRes.data ?? []) as ZoneRow[];
  const introductionRows = (introductionsRes.data ?? []) as IntroductionRow[];
  const userRows = (usersRes.data ?? []) as UserRow[];

  const businessById = new Map(businessRows.map((b) => [b.id, b]));
  const userNameById = new Map(userRows.map((u) => [u.id, u.name]));

  const businesses: MapBusiness[] = businessRows.map((b) => ({
    id: b.id,
    name: b.name,
    sector: b.sector,
    zone_id: b.zone_id,
    lat: Number(b.lat),
    lng: Number(b.lng),
    est_monthly_volume:
      b.est_monthly_volume != null ? Number(b.est_monthly_volume) : null,
    launch_6: b.launch_6,
    notes: b.notes,
  }));

  const links: MapLink[] = linkRows.map((link) => {
    const supplier = link.supplier_id
      ? businessById.get(link.supplier_id)
      : null;
    const buyer = link.buyer_id ? businessById.get(link.buyer_id) : null;
    return {
      id: link.id,
      product: link.product,
      est_monthly_volume:
        link.est_monthly_volume != null ? Number(link.est_monthly_volume) : null,
      payment_frequency: link.payment_frequency,
      supplier: supplier
        ? {
            id: supplier.id,
            name: supplier.name,
            lat: Number(supplier.lat),
            lng: Number(supplier.lng),
          }
        : null,
      buyer: buyer
        ? {
            id: buyer.id,
            name: buyer.name,
            lat: Number(buyer.lat),
            lng: Number(buyer.lng),
          }
        : null,
    };
  });

  const zones: MapZone[] = zoneRows.map((z) => ({
    id: z.id,
    name: z.name,
    centre_lat: z.centre_lat != null ? Number(z.centre_lat) : null,
    centre_lng: z.centre_lng != null ? Number(z.centre_lng) : null,
  }));

  const introductions: MapIntroduction[] = introductionRows.map((intro) => ({
    id: intro.id,
    contact_name: intro.contact_name,
    role: intro.role,
    business: intro.business,
    business_id: intro.business_id,
    warmth: intro.warmth,
    introduced_by_name: userNameById.get(intro.introduced_by) ?? "Unknown",
  }));

  return (
    <MapView
      businesses={businesses}
      links={links}
      zones={zones}
      introductions={introductions}
      canSeeIntros={canSeeIntros}
      canAddRecords={canAddRecords}
      currentUserId={user.id}
    />
  );
}
