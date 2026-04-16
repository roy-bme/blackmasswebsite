import type { PillTone } from "@/components/ops/ui/Pill";
import type { Event, EventDebrief } from "@/types/ops";

export type EventType =
  | "trade_fair"
  | "chamber"
  | "networking"
  | "industry_expo";

export const EVENT_TYPE_OPTIONS: Array<{ label: string; value: EventType }> = [
  { label: "Trade fair", value: "trade_fair" },
  { label: "Chamber", value: "chamber" },
  { label: "Networking", value: "networking" },
  { label: "Industry expo", value: "industry_expo" },
];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  trade_fair: "Trade fair",
  chamber: "Chamber",
  networking: "Networking",
  industry_expo: "Industry expo",
};

export const EVENT_TYPE_PILL_CLASS: Record<EventType, string> = {
  trade_fair: "bg-zimx-green/10 text-zimx-green border-zimx-green/30",
  chamber: "bg-blue-50 text-blue-700 border-blue-200",
  networking: "bg-purple-50 text-purple-700 border-purple-200",
  industry_expo: "bg-amber-50 text-amber-700 border-amber-200",
};

export const EVENT_TYPE_PILL_TONE: Record<EventType, PillTone> = {
  trade_fair: "success",
  chamber: "info",
  networking: "info",
  industry_expo: "warning",
};

export type UserLite = {
  id: string;
  name: string;
};

export type PersonMet = {
  name: string;
  business: string;
  role: string;
  discussed: string;
};

export const EMPTY_PERSON_MET: PersonMet = {
  name: "",
  business: "",
  role: "",
  discussed: "",
};

export type EventWithDebrief = Event & {
  debrief: EventDebrief | null;
};

/** JS ms in a day, used for urgency highlighting. */
export const URGENCY_WINDOW_DAYS = 7;
