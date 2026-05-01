import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Pill from "@/components/ops/ui/Pill";
import PageHeader from "@/components/ops/PageHeader";
import LogEventButton from "@/components/ops/Events/LogEventButton";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event as OpsEvent } from "@/types/ops";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

export default async function EventsPage() {
  await requireModuleAccess("/indaba/events");
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  const events = (data ?? []) as OpsEvent[];
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  return (
    <div>
      <PageHeader
        eyebrow="indaba · events"
        title="events"
        caption={`${upcoming.length} upcoming · ${past.length} past`}
        actions={
          <>
            <Pill tone="gold">Upcoming · {upcoming.length}</Pill>
            <Pill>Past · {past.length}</Pill>
            <LogEventButton />
          </>
        }
      />

      <div className="space-y-2 px-4 py-4 md:px-6 md:py-5">
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            title="No events yet."
            description="Log a BCCI luncheon or trade fair to track attendance and debriefs."
          />
        ) : null}

        {upcoming.map((e) => {
          const days = Math.max(
            0,
            Math.round(
              (new Date(e.date).getTime() - now.getTime()) / 86_400_000,
            ),
          );
          const priority = (e.priority ?? 3) >= 4 ? "high" : (e.priority ?? 3) >= 3 ? "med" : "low";
          const stripe =
            priority === "high"
              ? "bg-zimx-gold"
              : priority === "med"
                ? "bg-white/40"
                : "bg-line-15";
          return (
            <div key={e.id} className="flex border border-line-10 bg-ink-800">
              <span className={`w-1 ${stripe}`} />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-medium text-white">
                      {e.name}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                      {DATE_FMT.format(new Date(e.date))}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  {days <= 3 ? <Pill tone="gold">{days}d</Pill> : null}
                </div>
              </div>
            </div>
          );
        })}

        {past.length > 0 ? (
          <>
            <div className="pt-4 font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
              past
            </div>
            {past.slice(0, 5).map((e) => (
              <Card key={e.id} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[14px] text-white">{e.name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                      {DATE_FMT.format(new Date(e.date))}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  {e.status === "debriefed" ? (
                    <Pill tone="ok">debriefed</Pill>
                  ) : (
                    <Pill>no debrief</Pill>
                  )}
                </div>
              </Card>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
