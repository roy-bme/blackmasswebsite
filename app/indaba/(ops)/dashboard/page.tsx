import Card from "@/components/ops/ui/Card";
import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";
import { resolveFlash } from "@/lib/ops/flash";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AgentBrief,
  AgentRun,
  Business,
  BusinessStage,
  ComplianceFlag,
  RegulatorySignal,
} from "@/types/ops";

export const dynamic = "force-dynamic";

const STAGE_ORDER: BusinessStage[] = [
  "identified",
  "intel_gathered",
  "intro_made",
  "meeting_set",
  "meeting_done",
  "loi_signed",
  "onboarded",
];

const STAGE_LABELS: Record<BusinessStage, string> = {
  identified: "Identified",
  intel_gathered: "Intel gathered",
  intro_made: "Intro made",
  meeting_set: "Meeting set",
  meeting_done: "Meeting done",
  loi_signed: "LOI signed",
  onboarded: "Onboarded",
};

type DashboardPageProps = {
  searchParams: { flash?: string };
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireModuleAccess("/indaba/dashboard");
  const supabase = createSupabaseServerClient();
  const flash = resolveFlash(searchParams.flash);

  // One round-trip per role-relevant tile. Dashboards diverge by role so we
  // skip queries that won't render — saves DB time for narrow-role users.
  const [
    businessesRes,
    linksRes,
    introsRes,
    eventsUpcomingRes,
    agentRunsRes,
    briefRes,
    flagsRes,
    regSignalsRes,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, sector, onboarding_stage, launch_6"),
    supabase
      .from("supply_chain_links")
      .select("id", { count: "exact", head: true }),
    user.role === "admin" || user.role === "bd"
      ? supabase
          .from("introductions")
          .select("id, contact_name, business, roy_approved, status, warmth")
      : Promise.resolve({ data: [] }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "upcoming"),
    user.role === "admin" || user.role === "compliance"
      ? supabase
          .from("agent_runs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
    user.role === "admin" || user.role === "compliance"
      ? supabase
          .from("v_latest_agent_brief")
          .select("*")
          .eq("audience", user.role === "compliance" ? "compliance" : "admin")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user.role === "admin" || user.role === "compliance"
      ? supabase
          .from("compliance_flags")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
    user.role === "admin" || user.role === "compliance"
      ? supabase
          .from("regulatory_signals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  const businesses = (businessesRes.data ?? []) as Pick<
    Business,
    "id" | "name" | "sector" | "onboarding_stage" | "launch_6"
  >[];

  const stageCounts = STAGE_ORDER.reduce<Record<BusinessStage, number>>(
    (acc, stage) => ({ ...acc, [stage]: 0 }),
    {} as Record<BusinessStage, number>,
  );
  for (const b of businesses) {
    stageCounts[b.onboarding_stage] = (stageCounts[b.onboarding_stage] ?? 0) + 1;
  }
  const total = businesses.length;
  const launch6Done = businesses.filter(
    (b) => b.launch_6 && b.onboarding_stage === "onboarded",
  ).length;
  const linkCount = linksRes.count ?? 0;
  const eventsUpcoming = eventsUpcomingRes.count ?? 0;
  const intros =
    "data" in introsRes && Array.isArray(introsRes.data) ? introsRes.data : [];
  const introsPending = intros.filter((i) => !i.roy_approved).length;
  const runs = (agentRunsRes.data ?? []) as AgentRun[];
  const brief = briefRes.data as Pick<AgentBrief, "markdown" | "created_at"> | null;
  const flags = (flagsRes.data ?? []) as ComplianceFlag[];
  const regSignals = (regSignalsRes.data ?? []) as RegulatorySignal[];

  const greeting = greetingFor(user.name, user.role);
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const isAdmin = user.role === "admin";
  const isOps = user.role === "ops";
  const isBd = user.role === "bd";
  const isCompliance = user.role === "compliance";

  return (
    <div>
      {flash ? (
        <div
          role="status"
          className="border border-zimx-gold/40 bg-zimx-gold/10 px-4 py-3 font-mono text-[12px] uppercase tracking-eyebrow text-zimx-gold"
        >
          {flash}
        </div>
      ) : null}

      <PageHeader
        eyebrow={`${today.toLowerCase()} · ${user.role}`}
        title={greeting}
        actions={
          <>
            {isAdmin && introsPending > 0 ? (
              <Pill tone="gold" strong>
                {introsPending} pending approval
              </Pill>
            ) : null}
            {(isAdmin || isCompliance) && flags.some((f) => f.severity === "blocker") ? (
              <Pill tone="bad">1 blocker</Pill>
            ) : null}
            {(isAdmin || isCompliance) && runs.length > 0 ? (
              <Pill tone="ok">agent · ok</Pill>
            ) : null}
          </>
        }
      />

      <div className="px-4 py-5 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Businesses" value={String(total)} sub={`+${stageCounts.identified} new`} />
          <Metric label="Launch 6" value={`${launch6Done}/6`} sub="onboarded" gold />
          <Metric label="Supply links" value={String(linkCount)} sub="" />
          {(isAdmin || isBd) ? (
            <Metric
              label="Intros · open"
              value={String(intros.length)}
              sub={`${introsPending} pending`}
            />
          ) : null}
          <Metric label="Events · wk" value={String(eventsUpcoming)} sub="upcoming" />
          {(isAdmin || isCompliance) ? (
            <Metric label="Agent runs · 24h" value={String(runs.length)} sub="" />
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            {(isAdmin || isOps) ? (
              <Card padding="lg">
                <div className="flex items-center justify-between">
                  <Eyebrow>pipeline funnel</Eyebrow>
                  <Eyebrow>{total} total</Eyebrow>
                </div>
                <div className="mt-4 space-y-2">
                  {STAGE_ORDER.map((stage) => (
                    <PipelineRow
                      key={stage}
                      stage={stage}
                      count={stageCounts[stage]}
                      total={total}
                    />
                  ))}
                </div>
              </Card>
            ) : null}

            {(isAdmin || isCompliance) && brief ? (
              <Card padding="lg" accent="gold">
                <div className="flex items-center justify-between">
                  <Eyebrow gold>
                    today&apos;s brief · {timeOf(brief.created_at)}
                  </Eyebrow>
                  <Eyebrow>indaba.intel · v0.7</Eyebrow>
                </div>
                <div className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-fg-mute">
                  {firstParagraphs(brief.markdown, 4)}
                </div>
                <div className="mt-4 flex gap-2 border-t border-line-10 pt-4">
                  <Button href="/indaba/agent" variant="primary" size="sm">
                    Read full brief
                  </Button>
                  {isAdmin ? (
                    <a
                      href="mailto:roy@blackmass.co.uk?subject=Indaba%20Escalation&body=Hi%20Roy%2C%0A%0A"
                      className="inline-flex items-center justify-center gap-1 border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors h-8 border-white/15 text-fg-mute hover:border-zimx-gold/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zimx-gold"
                    >
                      Escalate to Roy
                    </a>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {isCompliance ? (
              <Card padding="lg">
                <div className="flex items-center justify-between">
                  <Eyebrow>recent flags · {flags.length} open</Eyebrow>
                  <Button href="/indaba/compliance" variant="bare" size="sm">
                    Open queue →
                  </Button>
                </div>
                <div className="mt-3 divide-y divide-line-10">
                  {flags.length === 0 ? (
                    <EmptyState
                      title="Queue is clear."
                      description="The agent will surface items here as it finds them."
                    />
                  ) : (
                    flags.map((f) => <FlagRow key={f.id} flag={f} />)
                  )}
                </div>
              </Card>
            ) : null}

            {isBd ? (
              <Card padding="lg">
                <Eyebrow gold>this week · intros</Eyebrow>
                <p className="mt-3 text-[14px] text-fg-mute">
                  Active intros, BCCI luncheon prep, and pipeline by sector.
                  Open <a href="/indaba/intros" className="text-zimx-gold">Intros</a> for the full list.
                </p>
              </Card>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {isAdmin ? (
              <Card padding="lg">
                <div className="flex items-center justify-between">
                  <Eyebrow gold>needs your decision</Eyebrow>
                  <Eyebrow>{introsPending}</Eyebrow>
                </div>
                {intros.filter((i) => !i.roy_approved).slice(0, 3).map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 border-t border-line-10 py-3"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-white">
                        Approve intro · {i.contact_name}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                        {i.business ?? "—"} · {i.warmth}
                      </div>
                    </div>
                    <Button href={`/indaba/intros?id=${i.id}`} variant="ghost" size="sm">
                      Review
                    </Button>
                  </div>
                ))}
                {introsPending === 0 ? (
                  <p className="mt-2 text-[12px] text-fg-mute">
                    Nothing waiting on you.
                  </p>
                ) : null}
              </Card>
            ) : null}

            {(isAdmin || isCompliance) ? (
              <Card padding="lg">
                <Eyebrow>agent · last 24h</Eyebrow>
                <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-loose text-fg-mute">
                  {runs.length === 0 ? (
                    <p className="text-fg-dim">No runs in the last 24h.</p>
                  ) : (
                    runs.map((r) => (
                      <div key={r.id} className="flex items-baseline gap-2">
                        <span className={statusGlyph(r.status)}>
                          {statusSymbol(r.status)}
                        </span>
                        <span className="text-fg-dim">{timeOf(r.started_at)}</span>
                        <span className="text-white">{r.agent_name}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 border-t border-line-10 pt-3">
                  <Button href="/indaba/agent" variant="bare" size="sm">
                    View full console →
                  </Button>
                </div>
              </Card>
            ) : null}

            {(isAdmin || isCompliance) && regSignals.length > 0 ? (
              <Card padding="lg">
                <Eyebrow>regulatory signals · 7d</Eyebrow>
                <div className="mt-3 divide-y divide-line-10">
                  {regSignals.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div>
                        <div className="font-mono text-[11px] uppercase tracking-eyebrow text-white">
                          {s.source} · {s.headline.slice(0, 40)}
                        </div>
                        <div className="mt-1 text-[12px] text-fg-mute">
                          {s.body?.slice(0, 80) ?? ""}
                        </div>
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
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type MetricProps = { label: string; value: string; sub?: string; gold?: boolean };

function Metric({ label, value, sub, gold }: MetricProps) {
  return (
    <Card padding="sm" accent={gold ? "gold" : undefined}>
      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono text-[24px] font-medium leading-none tracking-tight ${gold ? "text-zimx-gold" : "text-white"}`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 font-mono text-[10px] text-fg-mute">{sub}</p>
      ) : null}
    </Card>
  );
}

type PipelineRowProps = {
  stage: BusinessStage;
  count: number;
  total: number;
};

function PipelineRow({ stage, count, total }: PipelineRowProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow">
        <span className="text-white">{STAGE_LABELS[stage]}</span>
        <span className="text-fg-mute">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05]">
        <div
          className={
            stage === "onboarded" ? "h-full bg-zimx-gold" : "h-full bg-white/50"
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FlagRow({ flag }: { flag: ComplianceFlag }) {
  const tone =
    flag.severity === "blocker"
      ? "bad"
      : flag.severity === "warning"
        ? "warn"
        : "info";
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div>
        <Pill tone={tone}>{flag.severity}</Pill>
        <div className="mt-2 text-[13px] font-medium text-white">{flag.summary}</div>
      </div>
      <span className="font-mono text-[10px] text-fg-dim">
        {ago(flag.created_at)}
      </span>
    </div>
  );
}

function greetingFor(name: string, role: string) {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "good morning" : hour < 18 ? "good afternoon" : "good evening";
  if (role === "ops") return `today.`;
  if (role === "bd") return `this week.`;
  if (role === "compliance") return `your queue.`;
  return `${part}, ${name.split(" ")[0]?.toLowerCase() ?? "there"}.`;
}

function statusSymbol(status: AgentRun["status"]) {
  if (status === "ok") return "✓";
  if (status === "warn") return "!";
  if (status === "error") return "✕";
  return "·";
}

function statusGlyph(status: AgentRun["status"]) {
  if (status === "ok") return "text-status-ok";
  if (status === "warn") return "text-status-warn";
  if (status === "error") return "text-status-bad";
  return "text-fg-dim";
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function firstParagraphs(md: string, _maxLines: number) {
  return md.split(/\n\n/).slice(0, 3).join("\n\n");
}
