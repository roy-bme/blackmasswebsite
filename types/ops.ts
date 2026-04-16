/**
 * TypeScript types for the indaba ops portal database schema.
 *
 * These mirror the 12 Supabase tables that back the portal:
 *   1.  profiles
 *   2.  ventures
 *   3.  memberships
 *   4.  projects
 *   5.  tasks
 *   6.  meetings
 *   7.  meeting_attendees
 *   8.  documents
 *   9.  updates
 *   10. comments
 *   11. tags
 *   12. activity_log
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

// ─── enums ───────────────────────────────────────────────────────────────────

/** Org-wide role on the `profiles` row. Drives portal-level access. */
export type OpsRole = "admin" | "operator" | "viewer";

/** Per-venture role on the `memberships` row. */
export type VentureRole = "lead" | "contributor" | "observer";

export type ProjectStatus =
  | "planning"
  | "active"
  | "blocked"
  | "paused"
  | "shipped"
  | "archived";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type DocumentKind = "file" | "link" | "note";

export type UpdateKind = "status" | "decision" | "milestone" | "risk" | "note";

export type CommentTarget = "project" | "task" | "update" | "meeting" | "document";

export type ActivityVerb =
  | "created"
  | "updated"
  | "deleted"
  | "assigned"
  | "commented"
  | "completed"
  | "archived";

// ─── 1. profiles ─────────────────────────────────────────────────────────────

export type Profile = {
  id: Uuid; // = auth.users.id
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: OpsRole;
  title: string | null;
  bio: string | null;
  is_active: boolean;
  last_seen_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 2. ventures ─────────────────────────────────────────────────────────────

export type Venture = {
  id: Uuid;
  slug: string;
  name: string;
  short_name: string | null;
  sector: SectorKey;
  tagline: string | null;
  description: string | null;
  status: "live" | "pre_launch" | "concept" | "wound_down";
  website_url: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 3. memberships ──────────────────────────────────────────────────────────

export type Membership = {
  id: Uuid;
  profile_id: Uuid;
  venture_id: Uuid;
  role: VentureRole;
  is_primary: boolean;
  created_at: IsoDateTime;
};

// ─── 4. projects ─────────────────────────────────────────────────────────────

export type Project = {
  id: Uuid;
  venture_id: Uuid;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  status: ProjectStatus;
  owner_id: Uuid | null;
  start_date: IsoDate | null;
  target_date: IsoDate | null;
  shipped_at: IsoDateTime | null;
  archived_at: IsoDateTime | null;
  created_by: Uuid;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 5. tasks ────────────────────────────────────────────────────────────────

export type Task = {
  id: Uuid;
  project_id: Uuid | null;
  venture_id: Uuid | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: Uuid | null;
  due_date: IsoDate | null;
  completed_at: IsoDateTime | null;
  created_by: Uuid;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 6. meetings ─────────────────────────────────────────────────────────────

export type Meeting = {
  id: Uuid;
  venture_id: Uuid | null;
  project_id: Uuid | null;
  title: string;
  agenda: string | null;
  minutes: string | null;
  status: MeetingStatus;
  scheduled_at: IsoDateTime;
  duration_minutes: number | null;
  location: string | null;
  meeting_url: string | null;
  created_by: Uuid;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 7. meeting_attendees ────────────────────────────────────────────────────

export type MeetingAttendee = {
  id: Uuid;
  meeting_id: Uuid;
  profile_id: Uuid;
  is_required: boolean;
  rsvp_status: "pending" | "accepted" | "declined" | "tentative";
  attended: boolean;
  created_at: IsoDateTime;
};

// ─── 8. documents ────────────────────────────────────────────────────────────

export type Document = {
  id: Uuid;
  venture_id: Uuid | null;
  project_id: Uuid | null;
  kind: DocumentKind;
  title: string;
  description: string | null;
  /** For `kind = 'file'`, a Supabase Storage path; for `link`, an external URL. */
  storage_path: string | null;
  url: string | null;
  /** Markdown body, only populated when `kind = 'note'`. */
  body: string | null;
  mime_type: string | null;
  byte_size: number | null;
  created_by: Uuid;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 9. updates ──────────────────────────────────────────────────────────────

export type Update = {
  id: Uuid;
  venture_id: Uuid | null;
  project_id: Uuid | null;
  author_id: Uuid;
  kind: UpdateKind;
  title: string | null;
  body: string;
  pinned: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};

// ─── 10. comments ────────────────────────────────────────────────────────────

export type Comment = {
  id: Uuid;
  target_type: CommentTarget;
  target_id: Uuid;
  parent_id: Uuid | null;
  author_id: Uuid;
  body: string;
  edited_at: IsoDateTime | null;
  created_at: IsoDateTime;
};

// ─── 11. tags ────────────────────────────────────────────────────────────────

export type Tag = {
  id: Uuid;
  slug: string;
  label: string;
  color: string | null;
  description: string | null;
  created_at: IsoDateTime;
};

// ─── 12. activity_log ────────────────────────────────────────────────────────

export type ActivityLogEntry = {
  id: Uuid;
  actor_id: Uuid | null;
  verb: ActivityVerb;
  target_type: CommentTarget | "venture" | "profile" | "membership" | "tag";
  target_id: Uuid;
  venture_id: Uuid | null;
  metadata: Record<string, unknown> | null;
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
//   const row: ProfileInsert = { ... }
export type ProfileInsert = Insert<Profile>;
export type ProfileUpdate = Update_<Profile>;
export type VentureInsert = Insert<Venture>;
export type VentureUpdate = Update_<Venture>;
export type MembershipInsert = Insert<Membership>;
export type MembershipUpdate = Update_<Membership>;
export type ProjectInsert = Insert<Project>;
export type ProjectUpdate = Update_<Project>;
export type TaskInsert = Insert<Task>;
export type TaskUpdate = Update_<Task>;
export type MeetingInsert = Insert<Meeting>;
export type MeetingUpdate = Update_<Meeting>;
export type MeetingAttendeeInsert = Insert<MeetingAttendee>;
export type MeetingAttendeeUpdate = Update_<MeetingAttendee>;
export type DocumentInsert = Insert<Document>;
export type DocumentUpdate = Update_<Document>;
export type UpdateInsert = Insert<Update>;
export type UpdateUpdate = Update_<Update>;
export type CommentInsert = Insert<Comment>;
export type CommentUpdate = Update_<Comment>;
export type TagInsert = Insert<Tag>;
export type TagUpdate = Update_<Tag>;
export type ActivityLogInsert = Insert<ActivityLogEntry>;

/**
 * Lightweight registry of every table name. Useful for typed wrappers like
 * `supabase.from(OPS_TABLES.projects)` so the literal can't drift from the
 * row-type catalog above.
 */
export const OPS_TABLES = {
  profiles: "profiles",
  ventures: "ventures",
  memberships: "memberships",
  projects: "projects",
  tasks: "tasks",
  meetings: "meetings",
  meeting_attendees: "meeting_attendees",
  documents: "documents",
  updates: "updates",
  comments: "comments",
  tags: "tags",
  activity_log: "activity_log",
} as const;

export type OpsTableName = (typeof OPS_TABLES)[keyof typeof OPS_TABLES];
