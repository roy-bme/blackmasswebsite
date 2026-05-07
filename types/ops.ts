/**
 * TypeScript types for the indaba ops portal database schema.
 *
 * Mirrors the public.* tables that back the portal:
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
 * Plus the v1 additions for Compliance Queue, Agent Console, and Discovery:
 *   13. compliance_flags
 *   14. regulatory_signals
 *   15. agent_runs
 *   16. agent_briefs
 *   17. agent_suggestions
 *   18. discovery_candidates
 *   19. pipeline_signals
 */

import type { SectorKey } from "@/lib/ops/sector-colors";

// ─── shared scalars ──────────────────────────────────────────────────────────

export type Uuid = string;
export type IsoDateTime = string;
export type IsoDate = string;
export type Numeric = number;
export type Rating1to5 = 1 | 2 | 3 | 4 | 5;

// ─── enums ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "ops" | "bd" | "compliance";
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

export type FeedChannel =
  | "admin"
  | "ground_ops"
  | "bd_networking"
  | "compliance";

/** Legacy alias — older callers still import ActivityChannel. */
export type ActivityChannel = FeedChannel;

export type ActivityType =
  | "daily_report"
  | "comment"
  | "task_created"
  | "photo"
  | "event_log"
  | "status_update";

export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

export type ComplianceSeverity = "info" | "warning" | "blocker";
export type ComplianceFlagStatus =
  | "open"
  | "in_review"
  | "resolved"
  | "escalated";
export type ComplianceSource = "rule" | "agent" | "manual";
export type RegulatorySeverity = "low" | "med" | "high";
export type AgentRunStatus = "queued" | "running" | "ok" | "warn" | "error";
export type AgentSuggestionStatus =
  | "open"
  | "accepted"
  | "skipped"
  | "expired";
export type DiscoveryStatus = "open" | "promoted" | "dismissed";

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
  channel: FeedChannel;
  type: ActivityType;
  content: string;
  attachments: string[] | null;
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

// ─── 13. compliance_flags ────────────────────────────────────────────────────

export type ComplianceFlag = {
  id: Uuid;
  severity: ComplianceSeverity;
  source: ComplianceSource;
  business_id: Uuid | null;
  link_id: Uuid | null;
  summary: string;
  detail: string | null;
  status: ComplianceFlagStatus;
  notes: string | null;
  created_at: IsoDateTime;
  resolved_at: IsoDateTime | null;
  resolved_by: Uuid | null;
  assigned_to: Uuid | null;
};

// ─── 14. regulatory_signals ──────────────────────────────────────────────────

export type RegulatorySignal = {
  id: Uuid;
  jurisdiction: string;
  source: string;
  headline: string;
  body: string | null;
  severity: RegulatorySeverity;
  exposure: Record<string, unknown>;
  external_url: string | null;
  created_at: IsoDateTime;
};

// ─── 15. agent_runs ──────────────────────────────────────────────────────────

export type AgentRun = {
  id: Uuid;
  agent_name: string;
  status: AgentRunStatus;
  started_at: IsoDateTime;
  ended_at: IsoDateTime | null;
  duration_ms: number | null;
  outputs: Record<string, unknown>;
  trace_url: string | null;
  notes: string | null;
};

// ─── 16. agent_briefs ────────────────────────────────────────────────────────

export type AgentBrief = {
  id: Uuid;
  run_id: Uuid | null;
  audience: "admin" | "compliance";
  markdown: string;
  created_at: IsoDateTime;
};

// ─── 17. agent_suggestions ───────────────────────────────────────────────────

export type AgentSuggestion = {
  id: Uuid;
  run_id: Uuid | null;
  kind: string;
  target_id: Uuid | null;
  payload: Record<string, unknown>;
  status: AgentSuggestionStatus;
  created_at: IsoDateTime;
  accepted_at: IsoDateTime | null;
  accepted_by: Uuid | null;
};

// ─── 18. discovery_candidates ────────────────────────────────────────────────

export type DiscoveryCandidate = {
  id: Uuid;
  name: string;
  sector: string | null;
  confidence: Numeric | null;
  source: string;
  payload: Record<string, unknown>;
  status: DiscoveryStatus;
  promoted_to: Uuid | null;
  promoted_at: IsoDateTime | null;
  promoted_by: Uuid | null;
  created_at: IsoDateTime;
};

// ─── 19. pipeline_signals ────────────────────────────────────────────────────

export type PipelineSignal = {
  id: Uuid;
  candidate_id: Uuid;
  kind: string;
  evidence: string | null;
  payload: Record<string, unknown>;
  created_at: IsoDateTime;
};

// ─── insert / update helpers ─────────────────────────────────────────────────

type ServerManaged = "id" | "created_at" | "updated_at";

export type Insert<T> = Omit<T, ServerManaged> &
  Partial<Pick<T, Extract<ServerManaged, keyof T>>>;

export type Update_<T> = Partial<Omit<T, ServerManaged>>;

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
export type ComplianceFlagInsert = Insert<ComplianceFlag>;
export type ComplianceFlagUpdate = Update_<ComplianceFlag>;
export type DiscoveryCandidateInsert = Insert<DiscoveryCandidate>;
export type DiscoveryCandidateUpdate = Update_<DiscoveryCandidate>;

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
  compliance_flags: "compliance_flags",
  regulatory_signals: "regulatory_signals",
  agent_runs: "agent_runs",
  agent_briefs: "agent_briefs",
  agent_suggestions: "agent_suggestions",
  discovery_candidates: "discovery_candidates",
  pipeline_signals: "pipeline_signals",
} as const;

export type OpsTableName = (typeof OPS_TABLES)[keyof typeof OPS_TABLES];
