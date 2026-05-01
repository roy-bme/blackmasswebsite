import Link from "next/link";

import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Business,
  ComplianceFlag,
  ComplianceSeverity,
  RegulatorySignal,
} from "@/types/ops";

export const dynamic = "force-dynamic";

const SEV_TONE = {
  blocker: "bad",
  warning: "warn",
  info: "info",
} as const;

const SEV_ACCENT = {
  blocker: "bad",
  warning: "warn",
  info: "info",
} as const;

type FilterKey = "open" | "in_review" | "resolved" | "all";

type ComplianceQueuePageProps = {
  searchParams: { status?: string };
};

export default async function ComplianceQueuePage({
  searchParams,
}: ComplianceQueuePageProps) {
  await requireModuleAccess("/indaba/compliance");
  const supabase = createSupabaseServerClient();

  const statusFilter: FilterKey = ((): FilterKey => {
    const v = searchParams.status;
    if (v === "in_review" || v === "resolved" || v === "all") return v;
    return "open";
  })();

  let query = supabase
    .from("compliance_flags")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter === "open") query = query.eq("status", "open");
  else if (statusFilter === "in_review") query = query.eq("status", "in_review");
  else if (statusFilter === "resolved") query = query.eq("status", "resolved");

  const [flagsRes, businessesRes, signalsRes] = await Promise.all([
    query,
    supabase.from("businesses").select("id, name"),
    supabase
      .from("regulatory_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const flags = (flagsRes.data ?? []) as ComplianceFlag[];
  const businesses = (businessesRes.data ?? []) as Pick<
    Business,
    "id" | "name"
  >[];
  const signals = (signalsRes.data ?? []) as RegulatorySignal[];

  const bizById = new Map(businesses.map((b) => [b.id, b.name]));
  const counts = await loadCounts(supabase);

  const blockers = flags.filter((f) => f.severity === "blocker").length;

  return (
    <div>
      <PageHeader
        eyebrow="indaba · compliance · queue"
        title="your queue."
        caption={`${counts.open} open · ${blockers} blocker${blockers === 1 ? "" : "s"}`}
        actions={
          <>
            <FilterPill
              current={statusFilter}
              value="open"
              tone="gold"
              label={`Open · ${counts.open}`}
            />
            <FilterPill
              current={statusFilter}
              value="in_review"
              label={`In review · ${counts.in_review}`}
            />
            <FilterPill
              current={statusFilter}
              value="resolved"
              label={`Resolved · ${counts.resolved}`}
            />
          </>
        }
      />

      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-2">
          {flags.length === 0 ? (
            <EmptyState
              eyebrow="compliance queue · empty"
              title="Queue is clear."
              description="The agent will surface items here as it finds them."
            />
          ) : (
            flags.map((f) => (
              <Card
                key={f.id}
                padding="md"
                accent={SEV_ACCENT[f.severity as ComplianceSeverity]}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Pill tone={SEV_TONE[f.severity as ComplianceSeverity]}>
                      {f.severity}
                    </Pill>
                    <div className="mt-2 text-[14px] font-medium text-white">
                      {f.summary}
                    </div>
                    <div className="mt-1 text-[12px] text-fg-mute">
                      {f.business_id
                        ? bizById.get(f.business_id) ?? "—"
                        : f.detail ?? "—"}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-fg-dim">
                    {timeAgo(f.created_at)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line-10 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                    src · {f.source}
                  </span>
                  <Link
                    href={
                      f.business_id
                        ? `/indaba/directory?id=${f.business_id}`
                        : f.link_id
                          ? `/indaba/intros?id=${f.link_id}`
                          : "/indaba/directory"
                    }
                    className="border border-line-15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute hover:border-zimx-gold hover:text-white"
                  >
                    Review
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Card padding="lg">
            <Eyebrow>regulatory signals · 7d</Eyebrow>
            <div className="mt-3 divide-y divide-line-10">
              {signals.length === 0 ? (
                <p className="py-3 text-[12px] text-fg-mute">
                  No signals in the last 7 days.
                </p>
              ) : (
                signals.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-eyebrow text-white">
                        {s.source}
                      </div>
                      <div className="mt-1 text-[13px] text-white">
                        {s.headline}
                      </div>
                      {s.body ? (
                        <div className="mt-1 text-[12px] text-fg-mute">
                          {s.body.slice(0, 120)}
                        </div>
                      ) : null}
                    </div>
                    <Pill
                      tone={
                        s.severity === "high"
                          ? "bad"
                          : s.severity === "med"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {s.severity}
                    </Pill>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  current,
  value,
  label,
  tone,
}: {
  current: FilterKey;
  value: FilterKey;
  label: string;
  tone?: "gold";
}) {
  const active = current === value;
  return (
    <a
      href={`/indaba/compliance?status=${value}`}
      className="inline-flex"
    >
      <Pill tone={active && tone === "gold" ? "gold" : "neutral"} strong={active}>
        {label}
      </Pill>
    </a>
  );
}

async function loadCounts(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const [a, b, c] = await Promise.all([
    supabase
      .from("compliance_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("compliance_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_review"),
    supabase
      .from("compliance_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
  ]);
  return {
    open: a.count ?? 0,
    in_review: b.count ?? 0,
    resolved: c.count ?? 0,
  };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
