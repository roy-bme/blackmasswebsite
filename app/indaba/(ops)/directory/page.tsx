import Card from "@/components/ops/ui/Card";
import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import SectorChip from "@/components/ops/ui/SectorChip";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";
import { PRIMARY_SECTORS, getSectorHex } from "@/lib/ops/sector-colors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Business,
  BusinessStage,
  DiscoveryCandidate,
} from "@/types/ops";

export const dynamic = "force-dynamic";

const LANES: Array<{
  id: BusinessStage | "suggested";
  label: string;
  isAgent?: boolean;
}> = [
  { id: "suggested", label: "Suggested", isAgent: true },
  { id: "identified", label: "Identified" },
  { id: "intel_gathered", label: "Intel gathered" },
  { id: "intro_made", label: "Intro made" },
  { id: "meeting_set", label: "Meeting set" },
  { id: "meeting_done", label: "Meeting done" },
  { id: "loi_signed", label: "LOI signed" },
  { id: "onboarded", label: "Onboarded" },
];

type BizLite = Pick<
  Business,
  "id" | "name" | "sector" | "onboarding_stage" | "launch_6" | "address"
>;

export default async function DirectoryPage() {
  await requireModuleAccess("/indaba/directory");
  const supabase = createSupabaseServerClient();

  const [businessesRes, candidatesRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, onboarding_stage, launch_6, address")
      .order("name"),
    supabase
      .from("discovery_candidates")
      .select("*")
      .eq("status", "open")
      .order("confidence", { ascending: false })
      .limit(20),
  ]);

  const businesses = (businessesRes.data ?? []) as BizLite[];
  const suggested = (candidatesRes.data ?? []) as DiscoveryCandidate[];

  const byLane = new Map<string, BizLite[]>();
  for (const b of businesses) {
    const arr = byLane.get(b.onboarding_stage) ?? [];
    arr.push(b);
    byLane.set(b.onboarding_stage, arr);
  }

  const onboarded = byLane.get("onboarded")?.length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="indaba · directory · pipeline"
        title={`${businesses.length} businesses`}
        caption={`+ ${suggested.length} suggested · ${onboarded} onboarded`}
        actions={
          <>
            {PRIMARY_SECTORS.slice(0, 4).map((s) => (
              <SectorChip key={s} sector={s} />
            ))}
            <Button variant="ghost" size="sm">
              Launch 6
            </Button>
            <Button variant="primary" size="sm">
              + Add
            </Button>
          </>
        }
      />

      {/* Mobile: stage chip swiper + current lane */}
      <div className="md:hidden">
        <div className="indaba-thin-scroll flex gap-1.5 overflow-x-auto border-b border-line-10 px-4 py-3">
          {LANES.map((l) => (
            <span
              key={l.id}
              className={`whitespace-nowrap border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow ${
                l.isAgent
                  ? "border-zimx-gold/60 bg-zimx-gold/[0.04] text-zimx-gold"
                  : "border-line-15 text-fg-mute"
              }`}
            >
              {l.label}
            </span>
          ))}
        </div>
        <div className="space-y-2 px-4 py-4">
          {suggested.length > 0 ? (
            <>
              <Eyebrow gold>suggested · agent</Eyebrow>
              {suggested.slice(0, 3).map((c) => (
                <SuggestedCard key={c.id} c={c} />
              ))}
            </>
          ) : null}
          <Eyebrow>identified</Eyebrow>
          {(byLane.get("identified") ?? []).slice(0, 5).map((b) => (
            <BizCard key={b.id} b={b} />
          ))}
          {(byLane.get("identified") ?? []).length === 0 ? (
            <EmptyState
              title="No businesses in 'identified'."
              description="Move one from 'suggested' to start."
            />
          ) : null}
        </div>
      </div>

      {/* Desktop: 8-column kanban */}
      <div className="hidden md:block">
        <div className="indaba-thin-scroll overflow-x-auto px-6 py-4">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${LANES.length}, 230px)` }}
          >
            {LANES.map((lane) => {
              const items =
                lane.id === "suggested" ? [] : byLane.get(lane.id) ?? [];
              const candidateItems = lane.id === "suggested" ? suggested : [];
              const total = items.length + candidateItems.length;
              return (
                <div
                  key={lane.id}
                  className={`flex min-h-[480px] flex-col border ${
                    lane.isAgent
                      ? "border-zimx-gold/35 bg-zimx-gold/[0.04]"
                      : "border-line-10 bg-ink-800"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-line-10 px-3 py-2.5">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-eyebrow ${
                        lane.isAgent ? "text-zimx-gold" : "text-white"
                      }`}
                    >
                      {lane.label}
                    </span>
                    <span className="font-mono text-[10px] text-fg-dim">
                      {total}
                    </span>
                  </div>
                  <div className="indaba-thin-scroll flex-1 overflow-y-auto p-2">
                    {candidateItems.map((c) => (
                      <SuggestedCard key={c.id} c={c} />
                    ))}
                    {items.map((b) => (
                      <BizCard key={b.id} b={b} />
                    ))}
                    {total === 0 ? (
                      <div className="border border-dashed border-line-15 p-3 text-[11px] leading-relaxed text-fg-mute">
                        Empty. Move one when ready.
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BizCard({ b }: { b: BizLite }) {
  const sectorHex = getSectorHex(b.sector);
  return (
    <div
      className="mb-1.5 border border-line-10 bg-ink-700 p-2.5"
      style={{ borderLeft: `2px solid ${sectorHex}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-medium leading-snug text-white">
            {b.name}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">
            {b.sector} · {b.address ?? "—"}
          </div>
        </div>
        {b.launch_6 ? (
          <Pill tone="solid" size="sm">
            L6
          </Pill>
        ) : null}
      </div>
    </div>
  );
}

function SuggestedCard({ c }: { c: DiscoveryCandidate }) {
  return (
    <div
      className="mb-1.5 border border-zimx-gold/25 bg-ink-700 p-2.5"
      style={{
        borderLeft: `2px solid ${getSectorHex(c.sector ?? "manufacturing")}`,
      }}
    >
      <div className="text-[13px] font-medium leading-snug text-white">
        {c.name}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">
        agent · {c.source}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line-10 pt-2">
        <span className="font-mono text-[9px] uppercase tracking-eyebrow text-zimx-gold">
          {c.confidence ?? "?"}% conf.
        </span>
        <Button variant="primary" size="sm" className="text-[9px]">
          Promote
        </Button>
      </div>
    </div>
  );
}
