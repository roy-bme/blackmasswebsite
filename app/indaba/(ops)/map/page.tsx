import "leaflet/dist/leaflet.css";

import MapView from "@/components/ops/Map/MapView";
import type {
  MapBusiness,
  MapDiscoveryCandidate,
  MapIntroduction,
  MapLink,
  MapZone,
} from "@/components/ops/Map/types";
import PageHeader from "@/components/ops/PageHeader";
import Pill from "@/components/ops/ui/Pill";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Business,
  Introduction,
  SupplyChainLink,
  User,
  Zone,
} from "@/types/ops";

export const dynamic = "force-dynamic";

type BusinessRow = Omit<Business, never> & { active?: boolean };

type LinkRow = Pick<
  SupplyChainLink,
  | "id"
  | "supplier_id"
  | "buyer_id"
  | "product"
  | "est_monthly_volume"
  | "payment_frequency"
>;

type ZoneRow = Pick<Zone, "id" | "name" | "type" | "centre_lat" | "centre_lng" | "boundary_geojson">;

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
  const canAddRecords =
    user.role === "admin" || user.role === "ops" || user.role === "bd";

  const [businessesRes, linksRes, zonesRes, introductionsRes, usersRes, candidatesRes] =
    await Promise.all([
      supabase
        .from("businesses")
        .select(
          "id, name, sector, zone_id, lat, lng, est_monthly_volume, notes, decision_maker_name, decision_maker_title, phone, email, linkedin, key_suppliers, key_customers, pain_points, zimx_fit_score, active, mapped_by, created_at, photos",
        ),
      supabase
        .from("supply_chain_links")
        .select(
          "id, supplier_id, buyer_id, product, est_monthly_volume, payment_frequency",
        ),
      supabase.from("zones").select("id, name, type, centre_lat, centre_lng, boundary_geojson"),
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
      supabase
        .from("discovery_candidates")
        .select("id,name,sector,sub_sector,address,zone_id,lat,lng,decision_maker_name,decision_maker_title,phone,email,linkedin,source_url,source_type,discovery_confidence,review_status,review_notes,enrichment_raw,discovered_at")
        .in("review_status", ["raw", "enriched", "reviewed_hold"])
        .not("lat", "is", null)
        .not("lng", "is", null),
    ]);

  const businessRows = (businessesRes.data ?? []) as BusinessRow[];
  const linkRows = (linksRes.data ?? []) as LinkRow[];
  const zoneRows = (zonesRes.data ?? []) as ZoneRow[];
  const introductionRows = (introductionsRes.data ?? []) as IntroductionRow[];
  const userRows = (usersRes.data ?? []) as UserRow[];
  const candidateRows = (candidatesRes.data ?? []) as Record<string, unknown>[];

  const businessById = new Map(businessRows.map((b) => [b.id, b]));
  const userNameById = new Map(userRows.map((u) => [u.id, u.name]));
  const ownerCount = businessRows.reduce(
    (acc, business) => {
      if (!business.mapped_by) {
        acc.unattributed += 1;
      } else {
        const ownerName = userNameById.get(business.mapped_by) ?? "";
        const normalized = ownerName.toLowerCase();
        if (normalized.includes("brendon")) acc.brendon += 1;
        else if (normalized.includes("taf")) acc.tafadzwa += 1;
        else acc.unattributed += 1;
      }
      return acc;
    },
    { brendon: 0, tafadzwa: 0, unattributed: 0 },
  );

  const businesses: MapBusiness[] = businessRows.map((b) => ({
    id: b.id,
    name: b.name,
    sector: b.sector,
    zone_id: b.zone_id,
    lat: Number(b.lat),
    lng: Number(b.lng),
    est_monthly_volume:
      b.est_monthly_volume != null ? Number(b.est_monthly_volume) : null,
    notes: b.notes,
    decision_maker_name: b.decision_maker_name,
    decision_maker_title: b.decision_maker_title,
    phone: b.phone,
    email: b.email,
    linkedin: b.linkedin,
    key_suppliers: b.key_suppliers,
    key_customers: b.key_customers,
    pain_points: b.pain_points,
    zimx_fit_score: b.zimx_fit_score != null ? Number(b.zimx_fit_score) : null,
    active: Boolean(b.active ?? true),
    mapped_by: b.mapped_by ?? null,
    created_at: String(b.created_at ?? new Date().toISOString()),
    photos: b.photos ?? [],
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
    type: z.type ?? null,
    centre_lat: z.centre_lat != null ? Number(z.centre_lat) : null,
    centre_lng: z.centre_lng != null ? Number(z.centre_lng) : null,
    boundary_geojson: z.boundary_geojson ?? null,
  }));


  const discoveryCandidates: MapDiscoveryCandidate[] = candidateRows.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? "Unnamed candidate"),
    sector: (c.sector as MapDiscoveryCandidate["sector"]) ?? null,
    sub_sector: (c.sub_sector as string | null) ?? null,
    address: (c.address as string | null) ?? null,
    zone_id: (c.zone_id as string | null) ?? null,
    lat: Number(c.lat),
    lng: Number(c.lng),
    decision_maker_name: (c.decision_maker_name as string | null) ?? null,
    decision_maker_title: (c.decision_maker_title as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    linkedin: (c.linkedin as string | null) ?? null,
    source_url: (c.source_url as string | null) ?? null,
    source_type: String(c.source_type ?? "manual"),
    discovery_confidence: c.discovery_confidence != null ? Number(c.discovery_confidence) : null,
    review_status: (c.review_status as MapDiscoveryCandidate["review_status"]) ?? "raw",
    review_notes: (c.review_notes as string | null) ?? null,
    enrichment_raw: (c.enrichment_raw as Record<string, unknown> | null) ?? null,
    discovered_at: String(c.discovered_at ?? new Date().toISOString()),
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
    <div>
      <PageHeader
        eyebrow="indaba · map · bulawayo"
        title="territory."
        caption={`${businesses.length} businesses (B:${ownerCount.brendon} · T:${ownerCount.tafadzwa} · ?:${ownerCount.unattributed}) · ${discoveryCandidates.length} candidates · ${links.length} links · ${zones.length} zones`}
        actions={
          canAddRecords ? (
            <Pill tone="gold">{user.role}</Pill>
          ) : (
            <Pill tone="neutral">{user.role}</Pill>
          )
        }
      />

      <MapView
        businesses={businesses}
        links={links}
        zones={zones}
        introductions={introductions}
        discoveryCandidates={discoveryCandidates}
        canSeeIntros={canSeeIntros}
        canAddRecords={canAddRecords}
        canDeleteRecords={user.role === "admin"}
        currentUserId={user.id}
      />
    </div>
  );
}
