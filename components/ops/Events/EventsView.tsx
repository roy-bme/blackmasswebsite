"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";

import EventCard from "./EventCard";
import EventDetailDialog from "./EventDetailDialog";
import EventTabs, { type EventsTab } from "./EventTabs";
import NewEventDialog from "./NewEventDialog";
import { parseIsoDate, todayUtc } from "./dateRange";
import type { EventWithDebrief, UserLite } from "./types";

type EventsViewProps = {
  events: EventWithDebrief[];
  users: UserLite[];
  canEdit: boolean;
  currentUserId: string;
};

export default function EventsView({
  events,
  users,
  canEdit,
  currentUserId,
}: EventsViewProps) {
  const [tab, setTab] = useState<EventsTab>("upcoming");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = todayUtc().getTime();
  const usersById = useMemo(() => {
    const map = new Map<string, UserLite>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const { upcoming, past } = useMemo(() => {
    const up: EventWithDebrief[] = [];
    const pa: EventWithDebrief[] = [];
    for (const e of events) {
      const isPast =
        e.status === "attended" || parseIsoDate(e.date).getTime() < today;
      if (isPast) pa.push(e);
      else up.push(e);
    }
    // Upcoming: soonest first. Past: most recent first.
    up.sort((a, b) => a.date.localeCompare(b.date));
    pa.sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming: up, past: pa };
  }, [events, today]);

  const selected = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  );

  const visible = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-mono text-[13px] uppercase tracking-tag text-zinc-500">
          Events
        </h1>
        {canEdit ? (
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + Add event
          </Button>
        ) : null}
      </div>

      <EventTabs
        value={tab}
        onChange={setTab}
        upcomingCount={upcoming.length}
        pastCount={past.length}
      >
        <div className="pt-4">
          {visible.length === 0 ? (
            <EmptyState
              eyebrow="Events"
              title={
                tab === "upcoming"
                  ? "No upcoming events"
                  : "No past events yet"
              }
              description={
                tab === "upcoming"
                  ? "Add trade fairs, chamber meetups, and networking events."
                  : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    attendingUser={
                      event.attending
                        ? usersById.get(event.attending) ?? null
                        : null
                    }
                    onOpen={() => setSelectedId(event.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </EventTabs>

      <EventDetailDialog
        event={selected}
        users={users}
        canEdit={canEdit}
        currentUserId={currentUserId}
        onClose={() => setSelectedId(null)}
      />

      {canEdit ? (
        <NewEventDialog open={newOpen} onClose={() => setNewOpen(false)} />
      ) : null}
    </div>
  );
}
