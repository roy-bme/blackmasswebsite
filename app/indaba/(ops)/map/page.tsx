import Button from "@/components/ops/ui/Button";
import Card from "@/components/ops/ui/Card";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import EmptyState from "@/components/ops/ui/EmptyState";
import OfflineBanner from "@/components/ops/ui/OfflineBanner";
import Pill from "@/components/ops/ui/Pill";
import SectorChip from "@/components/ops/ui/SectorChip";
import SectorDot from "@/components/ops/ui/SectorDot";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";
import { PRIMARY_SECTORS, getSectorHex } from "@/lib/ops/sector-colors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Introduction } from "@/types/ops";

export const dynamic = "force-dynamic";

type BusinessLite = Pick<
  Business,
  "id" | "name" | "sector" | "lat" | "lng" | "launch_6" | "onboarding_stage" | "address"
>;

/**
 * Bulawayo bounds used for the simple in-page projection. Approximate — the
 * full Leaflet integration ships in a follow-up; for now we project lat/lng
 * to the placeholder grid using these bounds.
 */
const BOUNDS = { minLat: -20.27, maxLat: -20.05, minLng: 28.45, maxLng: 28.7 };

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

export default async function MapPage() {
  const user = await requireModuleAccess("/indaba/map");
  const supabase = createSupabaseServerClient();

  const canSeeIntros = user.role === "admin";

  const [businessesRes, introsRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, lat, lng, launch_6, onboarding_stage, address"),
    canSeeIntros
      ? supabase
          .from("introductions")
          .select("id, contact_name, business, business_id, warmth")
      : Promise.resolve({ data: [] }),
  ]);

  const businesses = (businessesRes.data ?? []) as BusinessLite[];
  const intros = (introsRes.data ?? []) as Pick<
    Introduction,
    "id" | "contact_name" | "business" | "business_id" | "warmth"
  >[];

  const introByBiz = new Map(intros.map((i) => [i.business_id, i]));
  const visitsDue = businesses.length;

  return (
    <div>
      <PageHeader
        eyebrow="indaba · map · bulawayo"
        title="territory."
        caption={`${businesses.length} mapped · ${intros.length} active intros`}
        actions={
          <>
            {PRIMARY_SECTORS.slice(0, 4).map((s) => (
              <SectorChip key={s} sector={s} active />
            ))}
            <Button variant="primary" size="sm" leadingIcon={<PlusIcon />}>
              Drop pin
            </Button>
          </>
        }
      />

      <div className="md:hidden">
        <OfflineBanner />
      </div>

      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5 lg:grid-cols-[1fr_360px]">
        {/* Map placeholder with projected business markers */}
        <div className="indaba-map-placeholder relative h-[420px] w-full border border-line-15 lg:h-[640px]">
          {businesses.map((b) => {
            const p = project(Number(b.lat), Number(b.lng));
            return (
              <span
                key={b.id}
                title={b.name}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  background: getSectorHex(b.sector),
                  boxShadow: "0 0 0 2px rgba(20,22,26,0.65)",
                }}
              />
            );
          })}
          {canSeeIntros
            ? intros
                .filter((i) => i.business_id)
                .map((i) => {
                  const biz = businesses.find((b) => b.id === i.business_id);
                  if (!biz) return null;
                  const p = project(Number(biz.lat), Number(biz.lng));
                  return (
                    <span
                      key={i.id}
                      title={`Intro · ${i.contact_name}`}
                      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-zimx-gold"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        boxShadow: "0 0 0 2px rgba(20,22,26,0.65)",
                      }}
                    />
                  );
                })
            : null}

          <div className="absolute bottom-3 left-3 border border-line-15 bg-ink-900/85 px-3 py-2 backdrop-blur">
            <Eyebrow>legend</Eyebrow>
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                <span className="h-2.5 w-2.5 bg-zimx-gold" /> your location
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                <span className="h-2.5 w-2.5 rotate-45 bg-zimx-gold" /> introduction
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                <span className="h-px w-3 border-t border-dashed border-white/40" />
                supply link
              </span>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <Card padding="lg">
            <Eyebrow gold>territory · today</Eyebrow>
            <p className="mt-2 text-[20px] font-light tracking-tight">
              {visitsDue} visits · 2 zones
            </p>
            <p className="mt-1 text-[12px] text-fg-mute">
              Pull-to-refresh on mobile to sync any queued submissions.
            </p>
          </Card>

          {businesses.slice(0, 5).map((b) => (
            <Card key={b.id} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-medium text-white">
                    {b.name}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <SectorDot sector={b.sector} />
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                      {b.sector} · {b.address ?? "unknown"}
                    </span>
                  </div>
                </div>
                {b.launch_6 ? <Pill tone="solid">L6</Pill> : null}
              </div>
            </Card>
          ))}
          {businesses.length === 0 ? (
            <EmptyState
              title="No businesses mapped yet."
              description="Drop a pin to add the first business."
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
