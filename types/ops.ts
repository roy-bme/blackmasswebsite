/**
 * TypeScript types for the indaba ops portal database schema.
 *
 * These mirror the 12 Supabase tables that back the portal:
 *   1.  users
 *   2.  zones
 *   3.  businesses
 *   4.  contacts
 *   5.  supply_chain_links
 *   6.  loops
 *   7.  introductions
 *   8.  events
 *   9.  event_debriefs
 *   10. activities
 *   11. tasks
 *   12. competitive_intel
 *
 * Phase 2 owns the SQL migrations themselves; this file is the canonical
 * client-side shape used by server components, route handlers, and the UI
 * primitives. Each row type matches the column names exactly (snake_case)
 * so it can be passed straight from `supabase.from(...).select()` results
 * with no manual mapping.
 *
 * Insert / Update variants are derived from the row type with `_id`,
 * timestamps, and server-defaults made optional.
 */

import type { SectorKey } from "@/lib/ops/sector-colors";

// ─── shared scalars ──────────────────────────────────────────────────────────

export type Uuid = string;
export type IsoDateTime = string;
export type IsoDate = string;

/** Postgres `numeric` — serialised as `number` over PostgREST in practice. */
export type Numeric = number;

/** Constrained 1–5 integer used by `zimx_fit_score`, `threat_level`, etc. */
export type Rating1to5 = 1 | 2 | 3 | 4 | 5;

// ─── enums ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "ops" | "bd";

export type BusinessType = "formal" | "informal";

export type BusinessStage =
  | "identified"
  | "intel_gathered"
  | "intro_made"
  | "meeting_set"
  | "meeting_done"
  | "loi_signed"
  | "onboarded";

export type IntroStatus =
  | "identified"
  | "contacted"
  | "intro_made"
  | "roy_approved"
  | "meeting_set"
  | "meeting_done"
  | "dormant";

export type ActivityChannel = "ground_ops" | "bd_networking" | "admin";

export type ActivityType =
  | "daily_report"
  | "comment"
  | "task_created"
  | "photo"
  | "event_log"
  | "status_update";

export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

// ─── 1. users ────────────────────────────────────────────────────────────────

export type User = {
  id: Uuid;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  zone_assigned: string | null;
  active: boolean;
  created_at: IsoDateTime;
};

// ─── 2. zones ────────────────────────────────────────────────────────────────

export type Zone = {
  id: Uuid;
  name: string;
  type: string | null;
  centre_lat: Numeric | null;
  centre_lng: Numeric | null;
  boundary_geojson: Record<string, unknown> | null;
  status: string;
  assigned_to: Uuid | null;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 3. businesses ───────────────────────────────────────────────────────────

export type Business = {
  id: Uuid;
  name: string;
  type: BusinessType;
  sector: SectorKey;
  sub_sector: string | null;
  address: string | null;
  zone_id: Uuid | null;
  lat: Numeric;
  lng: Numeric;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  payment_methods: string[] | null;
  est_monthly_volume: Numeric | null;
  key_suppliers: string[] | null;
  key_customers: string[] | null;
  pain_points: string[] | null;
  launch_6: boolean;
  onboarding_stage: BusinessStage;
  zimx_fit_score: Rating1to5 | null;
  mapped_by: Uuid | null;
  date_identified: IsoDate;
  notes: string | null;
  photos: string[] | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 4. contacts ─────────────────────────────────────────────────────────────

export type Contact = {
  id: Uuid;
  business_id: Uuid | null;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  relationship_source: string | null;
  warmth_level: string | null;
  introduced_by: Uuid | null;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 5. supply_chain_links ───────────────────────────────────────────────────

export type SupplyChainLink = {
  id: Uuid;
  supplier_id: Uuid | null;
  buyer_id: Uuid | null;
  product: string | null;
  payment_method: string | null;
  est_monthly_volume: Numeric | null;
  payment_frequency: string | null;
  friction_points: string[] | null;
  zimx_fit_score: Rating1to5 | null;
  mapped_by: Uuid | null;
  date_recorded: IsoDate;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 6. loops ────────────────────────────────────────────────────────────────

export type Loop = {
  id: Uuid;
  name: string;
  business_ids: Uuid[] | null;
  total_estimated_volume: Numeric | null;
  status: string;
  date_detected: IsoDate;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 7. introductions ────────────────────────────────────────────────────────

export type Introduction = {
  id: Uuid;
  contact_id: Uuid | null;
  contact_name: string;
  role: string | null;
  business: string | null;
  business_id: Uuid | null;
  introduced_by: Uuid;
  how_connected: string | null;
  why_relevant: string | null;
  pain_points_identified: string[] | null;
  cross_border: boolean;
  warmth: string;
  recommended_action: string | null;
  status: IntroStatus;
  roy_approved: boolean;
  date_created: IsoDate;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 8. events ───────────────────────────────────────────────────────────────

export type Event = {
  id: Uuid;
  name: string;
  date: IsoDate;
  end_date: IsoDate | null;
  location: string | null;
  type: string | null;
  expected_attendees: number | null;
  entry_cost: Numeric | null;
  priority: Rating1to5 | null;
  attending: Uuid | null;
  status: string;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── 9. event_debriefs ───────────────────────────────────────────────────────

export type EventDebrief = {
  id: Uuid;
  event_id: Uuid | null;
  submitted_by: Uuid | null;
  people_met: Record<string, unknown> | null;
  market_intel: string | null;
  competitive_intel: string | null;
  opportunities: string | null;
  follow_up_actions: string | null;
  date_submitted: IsoDateTime;
};

// ─── 10. activities ──────────────────────────────────────────────────────────

export type Activity = {
  id: Uuid;
  user_id: Uuid;
  channel: ActivityChannel;
  type: ActivityType;
  content: string;
  attachments: string[] | null;
  /** Self-referential — replies/threading point at the parent activity. */
  parent_id: Uuid | null;
  linked_business_id: Uuid | null;
  linked_intro_id: Uuid | null;
  created_at: IsoDateTime;
};

// ─── 11. tasks ───────────────────────────────────────────────────────────────

export type Task = {
  id: Uuid;
  title: string;
  description: string | null;
  assigned_to: Uuid | null;
  created_by: Uuid;
  due_date: IsoDate | null;
  status: TaskStatus;
  linked_business_id: Uuid | null;
  linked_intro_id: Uuid | null;
  created_at: IsoDateTime;
  completed_at: IsoDateTime | null;
};

// ─── 12. competitive_intel ───────────────────────────────────────────────────

export type CompetitiveIntel = {
  id: Uuid;
  competitor_name: string;
  type: string | null;
  location_observed: string | null;
  who_uses: string | null;
  offering: string | null;
  strengths: string | null;
  weaknesses: string | null;
  threat_level: Rating1to5 | null;
  observed_by: Uuid | null;
  date_observed: IsoDate;
  notes: string | null;
  created_at: IsoDateTime;
};

// ─── insert / update helpers ─────────────────────────────────────────────────

/**
 * Columns that are populated by Postgres (defaults / triggers) and therefore
 * always optional on insert.
 */
type ServerManaged = "id" | "created_at" | "updated_at";

export type Insert<T> = Omit<T, ServerManaged> &
  Partial<Pick<T, Extract<ServerManaged, keyof T>>>;

export type Update_<T> = Partial<Omit<T, ServerManaged>>;

// Per-table insert / update aliases so call sites read cleanly:
//   const row: BusinessInsert = { ... }
export type UserInsert = Insert<User>;
export type UserUpdate = Update_<User>;
export type ZoneInsert = Insert<Zone>;
export type ZoneUpdate = Update_<Zone>;
export type BusinessInsert = Insert<Business>;
export type BusinessUpdate = Update_<Business>;
export type ContactInsert = Insert<Contact>;
export type ContactUpdate = Update_<Contact>;
export type SupplyChainLinkInsert = Insert<SupplyChainLink>;
export type SupplyChainLinkUpdate = Update_<SupplyChainLink>;
export type LoopInsert = Insert<Loop>;
export type LoopUpdate = Update_<Loop>;
export type IntroductionInsert = Insert<Introduction>;
export type IntroductionUpdate = Update_<Introduction>;
export type EventInsert = Insert<Event>;
export type EventUpdate = Update_<Event>;
export type EventDebriefInsert = Insert<EventDebrief>;
export type EventDebriefUpdate = Update_<EventDebrief>;
export type ActivityInsert = Insert<Activity>;
export type ActivityUpdate = Update_<Activity>;
export type TaskInsert = Insert<Task>;
export type TaskUpdate = Update_<Task>;
export type CompetitiveIntelInsert = Insert<CompetitiveIntel>;
export type CompetitiveIntelUpdate = Update_<CompetitiveIntel>;

/**
 * Lightweight registry of every table name. Useful for typed wrappers like
 * `supabase.from(OPS_TABLES.businesses)` so the literal can't drift from the
 * row-type catalog above.
 */
export const OPS_TABLES = {
  users: "users",
  zones: "zones",
  businesses: "businesses",
  contacts: "contacts",
  supply_chain_links: "supply_chain_links",
  loops: "loops",
  introductions: "introductions",
  events: "events",
  event_debriefs: "event_debriefs",
  activities: "activities",
  tasks: "tasks",
  competitive_intel: "competitive_intel",
} as const;

export type OpsTableName = (typeof OPS_TABLES)[keyof typeof OPS_TABLES];
