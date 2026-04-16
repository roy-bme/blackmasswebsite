import type { IntroStatus } from "@/types/ops";

export type IntroBusinessOption = {
  id: string;
  name: string;
};

export type StatusFilter =
  | "all"
  | "pending_approval"
  | "approved"
  | "contacted"
  | "meeting_set";

export type WarmthFilter = "all" | "cold" | "warm" | "hot";

export const INTRO_STATUS_OPTIONS: Array<{
  label: string;
  value: IntroStatus;
}> = [
  { label: "Identified", value: "identified" },
  { label: "Contacted", value: "contacted" },
  { label: "Intro made", value: "intro_made" },
  { label: "Roy approved", value: "roy_approved" },
  { label: "Meeting set", value: "meeting_set" },
  { label: "Meeting done", value: "meeting_done" },
  { label: "Dormant", value: "dormant" },
];

export const PAIN_POINT_OPTIONS = [
  "ZIPIT caps",
  "IMTT costs",
  "Cash risk",
  "Slow banks",
  "Diaspora connection",
  "Supplier trust",
  "No paper trail",
  "Other",
] as const;

export type PainPoint = (typeof PAIN_POINT_OPTIONS)[number];

export const WARMTH_OPTIONS = [
  { label: "Cold", value: "cold" },
  { label: "Warm", value: "warm" },
  { label: "Hot", value: "hot" },
] as const;
