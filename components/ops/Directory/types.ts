import type {
  Activity,
  Business,
  BusinessStage,
  Contact,
  SupplyChainLink,
  UserRole,
  Zone,
} from "@/types/ops";

/**
 * Full business row passed into the directory client. We take every field
 * that the detail dialog may display or edit, plus the joined zone name so
 * the list/kanban can render "sector · zone" without a second lookup.
 */
export type DirectoryBusiness = Business & {
  zone_name: string | null;
};

export type DirectoryZone = Pick<Zone, "id" | "name">;

export type DirectoryUser = {
  id: string;
  name: string;
  role: UserRole;
};

export type DirectoryContact = Contact;

export type DirectoryLink = SupplyChainLink;

export type DirectoryActivity = Activity & {
  user_name: string | null;
};

export const STAGE_LABELS: Record<BusinessStage, string> = {
  identified: "Identified",
  intel_gathered: "Intel gathered",
  intro_made: "Intro made",
  meeting_set: "Meeting set",
  meeting_done: "Meeting done",
  loi_signed: "LOI signed",
  onboarded: "Onboarded",
};

export const STAGE_ORDER: BusinessStage[] = [
  "identified",
  "intel_gathered",
  "intro_made",
  "meeting_set",
  "meeting_done",
  "loi_signed",
  "onboarded",
];

/**
 * Kanban collapses the seven business stages into four visual columns.
 * `meeting_done` and `loi_signed` both sit under "Meeting set"; `intro_made`
 * sits under "Intel gathered".
 */
export type KanbanColumnKey =
  | "identified"
  | "intel_gathered"
  | "meeting_set"
  | "onboarded";

export const KANBAN_COLUMNS: Array<{
  key: KanbanColumnKey;
  label: string;
  stages: BusinessStage[];
  /** Stage written back to Supabase when a card is dropped into this column. */
  defaultStage: BusinessStage;
}> = [
  {
    key: "identified",
    label: "Identified",
    stages: ["identified"],
    defaultStage: "identified",
  },
  {
    key: "intel_gathered",
    label: "Intel gathered",
    stages: ["intel_gathered", "intro_made"],
    defaultStage: "intel_gathered",
  },
  {
    key: "meeting_set",
    label: "Meeting set",
    stages: ["meeting_set", "meeting_done", "loi_signed"],
    defaultStage: "meeting_set",
  },
  {
    key: "onboarded",
    label: "Onboarded",
    stages: ["onboarded"],
    defaultStage: "onboarded",
  },
];

export function columnForStage(stage: BusinessStage): KanbanColumnKey {
  const col = KANBAN_COLUMNS.find((c) => c.stages.includes(stage));
  return col?.key ?? "identified";
}
