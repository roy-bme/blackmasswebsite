import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import ZitfSummaryTile from "@/components/ops/Zitf/ZitfSummaryTile";
import { cn } from "@/lib/ops/cn";
import { requireModuleAccess } from "@/lib/ops/auth";
import { resolveFlash } from "@/lib/ops/flash";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getZoneBounds, pointInBounds } from "@/lib/ops/zone-bounds";
import type {
  Business,
  BusinessStage,
  Loop,
  Task,
  TaskStatus,
  User,
  Zone,
} from "@/types/ops";
import { canViewZitf, type ZitfOpsSummary } from "@/types/zitf";

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

const TASK_STATUS_TONES: Record<TaskStatus, PillTone> = {
  open: "warning",
  in_progress: "info",
  done: "success",
  cancelled: "neutral",
};

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDueDate(isoDate: string | null): string {
  if (!isoDate) return "No due date";
  return DATE_FMT.format(new Date(isoDate));
}

type BusinessLite = Pick<
  Business,
  "id" | "name" | "zone_id" | "onboarding_stage" | "launch_6" | "lat" | "lng"
>;

type CountOnly = { count: number | null };
type DataOnly<T> = { data: T[] | null };

type DashboardPageProps = {
  searchParams: { flash?: string };
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireModuleAccess("/indaba/dashboard");
  const supabase = createSupabaseServerClient();

  const flash = resolveFlash(searchParams.flash);

  const isAdmin = user.role === "admin";
  const isOps = user.role === "ops";
  const canSeeIntros = user.role === "admin" || user.role === "bd";
  const canSeeZones = isAdmin || isOps;
  const canSeeZitf = canViewZitf(user.role);

  const [
    businessesRes,
    linksRes,
    loopsRes,
    introCountRes,
    introApprovedRes,
    eventsUpcomingRes,
    tasksRes,
    zonesRes,
    usersRes,
    zitfSummaryRes,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, zone_id, onboarding_stage, launch_6, lat, lng"),
    supabase
      .from("supply_chain_links")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("loops")
      .select("*")
      .order("created_at", { ascending: false }),
    canSeeIntros
      ? supabase
          .from("introductions")
          .select("*", { count: "exact", head: true })
      : (Promise.resolve({ count: 0 }) as Promise<CountOnly>),
    canSeeIntros
      ? supabase
          .from("introductions")
          .select("*", { count: "exact", head: true })
          .eq("roy_approved", true)
      : (Promise.resolve({ count: 0 }) as Promise<CountOnly>),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "upcoming"),
    isAdmin
      ? supabase.from("tasks").select("*").neq("status", "done")
      : supabase
          .from("tasks")
          .select("*")
          .neq("status", "done")
          .eq("assigned_to", user.id),
    canSeeZones
      ? supabase.from("zones").select("*").order("name")
      : (Promise.resolve({ data: [] as Zone[] }) as Promise<DataOnly<Zone>>),
    supabase.from("users").select("id, name"),
    canSeeZitf
      ? supabase.from("v_zitf_ops_summary").select("*").maybeSingle()
      : (Promise.resolve({ data: null }) as Promise<{
          data: ZitfOpsSummary | null;
        }>),
  ]);

  const businesses = (businessesRes.data ?? []) as BusinessLite[];
  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));

  const totalBusinesses = businesses.length;
  const mappedBusinesses = businesses.filter(
    (b) => b.onboarding_stage !== "identified",
  ).length;
  const launch6Done = businesses.filter(
    (b) => b.launch_6 && b.onboarding_stage !== "identified",
  ).length;

  const pipelineCounts = STAGE_ORDER.reduce<Record<BusinessStage, number>>(
    (acc, stage) => ({ ...acc, [stage]: 0 }),
    {
      identified: 0,
      intel_gathered: 0,
      intro_made: 0,
      meeting_set: 0,
      meeting_done: 0,
      loi_signed: 0,
      onboarded: 0,
    },
  );
  for (const b of businesses) {
    pipelineCounts[b.onboarding_stage] += 1;
  }

  const linkCount = linksRes.count ?? 0;
  const loops = (loopsRes.data ?? []) as Loop[];
  const loopCount = loops.length;

  const introCount = introCountRes.count ?? 0;
  const introApproved = introApprovedRes.count ?? 0;

  const eventsUpcoming = eventsUpcomingRes.count ?? 0;

  const tasks = (tasksRes.data ?? []) as Task[];
  const users = (usersRes.data ?? []) as Pick<User, "id" | "name">[];
  const userNameById = new Map(users.map((u) => [u.id, u.name]));
  const openTasksCount = tasks.length;

  const openTaskList = tasks
    .filter((t) => t.status === "open" || t.status === "in_progress")
    .sort((a, b) => {
      const aDue = a.due_date ?? "9999-12-31";
      const bDue = b.due_date ?? "9999-12-31";
      return aDue.localeCompare(bDue);
    });

  const zitfSummary = (zitfSummaryRes.data ?? null) as ZitfOpsSummary | null;

  const zones = (zonesRes.data ?? []) as Zone[];
  // Compute zone membership by lat/lng bounds rather than relying on the
  // zone_id FK, which is null for many seeded businesses. See lib/ops/zone-bounds.
  const zoneStats = zones.map((zone) => {
    const bounds = getZoneBounds(zone);
    const inZone = bounds
      ? businesses.filter(
          (b) => b.zone_id === zone.id || pointInBounds(b, bounds),
        )
      : businesses.filter((b) => b.zone_id === zone.id);
    const past = inZone.filter(
      (b) => b.onboarding_stage !== "identified",
    ).length;
    return { zone, total: inZone.length, past };
  });

  return (
    <div className="space-y-6">
      {flash ? (
        <div
          role="alert"
          className="border border-zimx-gold/40 bg-zimx-gold/10 px-4 py-3 font-mono text-[12px] uppercase tracking-tag text-zimx-black"
        >
          {flash}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-3",
          "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
        )}
      >
        <MetricCard
          label="Businesses mapped"
          value={totalBusinesses.toString()}
          sub={`${mappedBusinesses} with intel`}
        />
        <MetricCard
          label="Launch 6 progress"
          value={`${launch6Done}/6`}
          sub="at intel stage+"
        />
        <MetricCard
          label="Supply chain links"
          value={linkCount.toString()}
          sub={`${loopCount} loops found`}
        />
        {canSeeIntros ? (
          <MetricCard
            label="Introductions"
            value={introCount.toString()}
            sub={`${introApproved} approved`}
          />
        ) : null}
        <MetricCard
          label="Events"
          value={eventsUpcoming.toString()}
          sub="upcoming"
        />
        <MetricCard label="Open tasks" value={openTasksCount.toString()} />
      </div>

      {canSeeZitf ? <ZitfSummaryTile summary={zitfSummary} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card padding="none">
            <Card.Header>
              <Card.Title>Pipeline</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              {STAGE_ORDER.map((stage) => (
                <PipelineRow
                  key={stage}
                  stage={stage}
                  count={pipelineCounts[stage]}
                  total={totalBusinesses}
                />
              ))}
            </Card.Body>
          </Card>

          <Card padding="none">
            <Card.Header>
              <Card.Title>Loops</Card.Title>
            </Card.Header>
            <Card.Body>
              {loops.length === 0 ? (
                <EmptyState
                  title="No loops yet"
                  description="No loops detected yet. Log supply chain links and run detection."
                />
              ) : (
                <div className="space-y-3">
                  {loops.map((loop) => (
                    <LoopCard
                      key={loop.id}
                      loop={loop}
                      businessNameById={businessNameById}
                    />
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-4">
          {canSeeZones ? (
            <Card padding="none">
              <Card.Header>
                <Card.Title>Zone coverage</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                {zoneStats.length === 0 ? (
                  <p className="text-[13px] text-zinc-500">
                    No zones configured.
                  </p>
                ) : (
                  zoneStats.map(({ zone, total, past }) => (
                    <ZoneRow
                      key={zone.id}
                      zone={zone}
                      total={total}
                      past={past}
                    />
                  ))
                )}
              </Card.Body>
            </Card>
          ) : null}

          <Card padding="none">
            <Card.Header>
              <Card.Title>Open tasks</Card.Title>
            </Card.Header>
            <Card.Body>
              {openTaskList.length === 0 ? (
                <EmptyState
                  title="No open tasks"
                  description={
                    isAdmin
                      ? "All tasks are clear."
                      : "Nothing assigned to you."
                  }
                />
              ) : (
                <ul className="divide-y divide-zinc-200">
                  {openTaskList.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      assigneeName={
                        task.assigned_to
                          ? userNameById.get(task.assigned_to) ?? null
                          : null
                      }
                    />
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  sub?: string;
};

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <Card padding="sm">
      <p className="font-mono text-[12px] uppercase tracking-tag text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-semibold leading-none text-zimx-black">
        {value}
      </p>
      {sub ? <p className="mt-2 text-[11px] text-zinc-400">{sub}</p> : null}
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
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-tag">
        <span className="text-zimx-black">{STAGE_LABELS[stage]}</span>
        <span className="text-zinc-500">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-100">
        <div
          className="h-full bg-zimx-green"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

type ZoneRowProps = {
  zone: Zone;
  total: number;
  past: number;
};

function ZoneRow({ zone, total, past }: ZoneRowProps) {
  const pct = total > 0 ? (past / total) * 100 : 0;
  const label =
    total === 0 ? "0 mapped" : `${past}/${total} past identified`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium text-zimx-black">
          {zone.name}
        </span>
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-tag text-zinc-500">
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-100">
        <div
          className="h-full bg-zimx-green"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

type LoopCardProps = {
  loop: Loop;
  businessNameById: Map<string, string>;
};

function LoopCard({ loop, businessNameById }: LoopCardProps) {
  const chain = (loop.business_ids ?? [])
    .map((id) => businessNameById.get(id) ?? "Unknown")
    .join(" \u2192 ");
  const volume = loop.total_estimated_volume ?? 0;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="font-medium text-amber-900">{loop.name}</p>
      {chain ? (
        <p className="mt-1 text-[13px] text-amber-900/80">{chain}</p>
      ) : null}
      <p className="mt-1 text-[12px] text-amber-700">
        Est. ${volume.toLocaleString()}/mo potential
      </p>
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  assigneeName: string | null;
};

function TaskRow({ task, assigneeName }: TaskRowProps) {
  const tone = TASK_STATUS_TONES[task.status];
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-zimx-black">
          {task.title}
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
          {assigneeName ?? "Unassigned"} &middot; {formatDueDate(task.due_date)}
        </p>
      </div>
      <Pill tone={tone} size="sm">
        {task.status.replace("_", " ")}
      </Pill>
    </li>
  );
}
