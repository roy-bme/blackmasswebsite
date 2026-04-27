import Card from "@/components/ops/ui/Card";
import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import SectorChip from "@/components/ops/ui/SectorChip";
import SectorDot from "@/components/ops/ui/SectorDot";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";
import { PRIMARY_SECTORS, getSectorHex } from "@/lib/ops/sector-colors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Loop, SupplyChainLink } from "@/types/ops";

export const dynamic = "force-dynamic";

const RAILS: Array<{ y: number; label: string; sector: string }> = [
  { y: 130, label: "mining", sector: "mining" },
  { y: 280, label: "manufacturing", sector: "manufacturing" },
  { y: 430, label: "retail", sector: "retail" },
  { y: 580, label: "services", sector: "services" },
];

const SECTOR_LAYER: Record<string, number> = {
  mining: 0,
  agriculture: 0,
  manufacturing: 1,
  fmcg: 1,
  retail: 2,
  wholesale: 2,
  services: 3,
  fuel: 2,
};

type BizLite = Pick<Business, "id" | "name" | "sector" | "launch_6">;

export default async function GraphPage() {
  await requireModuleAccess("/indaba/graph");
  const supabase = createSupabaseServerClient();

  const [businessesRes, linksRes, loopsRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, launch_6")
      .order("name"),
    supabase.from("supply_chain_links").select("*"),
    supabase
      .from("loops")
      .select("*")
      .order("date_detected", { ascending: false }),
  ]);

  const businesses = (businessesRes.data ?? []) as BizLite[];
  const links = (linksRes.data ?? []) as SupplyChainLink[];
  const loops = (loopsRes.data ?? []) as Loop[];

  const loopMembers = new Set<string>();
  for (const l of loops) {
    for (const id of l.business_ids ?? []) loopMembers.add(id);
  }

  // Lay out nodes per rail.
  const railIndex: Record<number, BizLite[]> = { 0: [], 1: [], 2: [], 3: [] };
  for (const b of businesses) {
    const idx = SECTOR_LAYER[b.sector] ?? 1;
    railIndex[idx]!.push(b);
  }

  type Pos = { x: number; y: number; b: BizLite };
  const positions = new Map<string, Pos>();
  for (const [idxKey, items] of Object.entries(railIndex)) {
    const idx = Number(idxKey);
    const rail = RAILS[idx];
    if (!rail) continue;
    const step = items.length > 0 ? 760 / (items.length + 1) : 0;
    items.forEach((b, i) => {
      positions.set(b.id, { x: 60 + step * (i + 1), y: rail.y, b });
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow={`indaba · graph · ${links.length} links · ${loops.length} loops`}
        title="bulawayo · pilot"
        actions={
          <>
            {PRIMARY_SECTORS.slice(0, 4).map((s) => (
              <SectorChip key={s} sector={s} active />
            ))}
            <Button variant="primary" size="sm">
              Detect loops
            </Button>
          </>
        }
      />

      <div className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_320px] md:px-6 md:py-5">
        <Card padding="none" className="overflow-hidden">
          <div className="bg-ink-700">
            <svg
              viewBox="0 0 880 700"
              className="block h-[480px] w-full md:h-[640px]"
            >
              {RAILS.map((r) => (
                <g key={r.label}>
                  <line
                    x1={40}
                    y1={r.y}
                    x2={840}
                    y2={r.y}
                    stroke={getSectorHex(r.sector)}
                    strokeOpacity={0.18}
                    strokeDasharray="2 6"
                  />
                  <text
                    x={40}
                    y={r.y - 18}
                    fill={getSectorHex(r.sector)}
                    fontFamily="monospace"
                    fontSize={10}
                    letterSpacing={2}
                  >
                    {r.label.toUpperCase()}
                  </text>
                </g>
              ))}
              {links.map((link) => {
                if (!link.supplier_id || !link.buyer_id) return null;
                const a = positions.get(link.supplier_id);
                const b = positions.get(link.buyer_id);
                if (!a || !b) return null;
                const isLoop = loopMembers.has(a.b.id) && loopMembers.has(b.b.id);
                return (
                  <path
                    key={link.id}
                    d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 30} ${b.x} ${b.y}`}
                    stroke={isLoop ? "#D4AF37" : "rgba(255,255,255,0.18)"}
                    strokeWidth={isLoop ? 1.6 : 1}
                    fill="none"
                  />
                );
              })}
              {Array.from(positions.values()).map(({ x, y, b }) => (
                <g key={b.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill={getSectorHex(b.sector)}
                    stroke={loopMembers.has(b.id) ? "#D4AF37" : "#14161a"}
                    strokeWidth={2}
                  />
                  <text
                    x={x}
                    y={y + 22}
                    fill="#fff"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {b.name.length > 16 ? `${b.name.slice(0, 14)}…` : b.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card padding="lg">
            <Eyebrow gold>loops detected · {loops.length}</Eyebrow>
          </Card>
          {loops.length === 0 ? (
            <EmptyState
              title="No loops yet."
              description="Run 'Detect loops' once supply links accumulate."
            />
          ) : (
            loops.map((l) => (
              <Card
                key={l.id}
                padding="md"
                className="border-zimx-gold/25 bg-zimx-gold/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium text-zimx-gold">
                    {l.name}
                  </div>
                  {l.status === "target" ? (
                    <Pill tone="gold" strong>
                      target
                    </Pill>
                  ) : null}
                </div>
                <div className="mt-2 font-mono text-[10px] leading-relaxed text-fg-mute">
                  {(l.business_ids ?? [])
                    .map((id) => businesses.find((b) => b.id === id)?.name ?? "?")
                    .join(" → ")}
                </div>
                {l.total_estimated_volume ? (
                  <div className="mt-2 font-mono text-[11px] text-zimx-gold">
                    ${Number(l.total_estimated_volume).toLocaleString()} / mo
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
