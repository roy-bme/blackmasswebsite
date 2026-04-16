"use client";

import Card from "@/components/ops/ui/Card";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";

import { daysBetween, formatDateRange, parseIsoDate, todayUtc } from "./dateRange";
import {
  EVENT_TYPE_LABEL,
  EVENT_TYPE_PILL_CLASS,
  EVENT_TYPE_PILL_TONE,
  URGENCY_WINDOW_DAYS,
  type EventType,
  type EventWithDebrief,
  type UserLite,
} from "./types";

type EventCardProps = {
  event: EventWithDebrief;
  attendingUser: UserLite | null;
  onOpen: () => void;
};

export default function EventCard({
  event,
  attendingUser,
  onOpen,
}: EventCardProps) {
  const typeKey = (event.type ?? "") as EventType;
  const typeLabel = EVENT_TYPE_LABEL[typeKey] ?? event.type ?? "Event";
  const typeTone = EVENT_TYPE_PILL_TONE[typeKey] ?? "neutral";
  const typeClass = EVENT_TYPE_PILL_CLASS[typeKey];

  const urgent = isWithinUrgencyWindow(event.date, event.status);

  return (
    <Card
      padding="none"
      interactive
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Open ${event.name}`}
      className={cn(urgent && "border-l-4 border-l-zimx-gold")}
    >
      <Card.Body className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              {formatDateRange(event.date, event.end_date)}
            </p>
            <h3 className="text-lg font-semibold text-zimx-black">
              {event.name}
            </h3>
            {event.location ? (
              <p className="text-[13px] text-zinc-500">{event.location}</p>
            ) : null}
          </div>
          <Pill tone={typeTone} size="sm" className={typeClass}>
            {typeLabel}
          </Pill>
        </div>

        {event.notes ? (
          <p className="text-sm text-zinc-600">{event.notes}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {event.priority != null ? <PriorityDots value={event.priority} /> : null}
          {attendingUser ? (
            <Pill tone="ink" size="sm">
              {attendingUser.name}
            </Pill>
          ) : null}
          {event.debrief ? (
            <Pill tone="success" size="sm">
              Debrief logged
            </Pill>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
}

function PriorityDots({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
      <span>Priority {clamped}/5</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              i < clamped ? "bg-zimx-black" : "bg-zinc-200",
            )}
          />
        ))}
      </span>
    </span>
  );
}

function isWithinUrgencyWindow(startIso: string, status: string | null): boolean {
  if (status === "attended") return false;
  const start = parseIsoDate(startIso);
  const days = daysBetween(start, todayUtc());
  // Gold border for events starting within the next URGENCY_WINDOW_DAYS days
  // (and not already finished / >1 day in the past).
  return days >= -1 && days <= URGENCY_WINDOW_DAYS;
}
