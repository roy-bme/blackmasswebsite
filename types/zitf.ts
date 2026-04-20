/**
 * Types for the ZITF 2026 stand-response pipeline.
 *
 * Mirrors the `public.zitf_responses` table and the `v_zitf_ops_summary`
 * view used by the Indaba portal. Enum values match the database check
 * constraints exactly; update here when the migration moves.
 */

import type { IsoDateTime, Numeric, Uuid } from "@/types/ops";

// ─── enums ───────────────────────────────────────────────────────────────────

export type ZitfChannel = "digital" | "paper" | "import";

export type ZitfStatus =
  | "new"
  | "qualified"
  | "contacted"
  | "pilot_candidate"
  | "rejected";

/**
 * Spend bands used by the qualification scoring. Kept as an ordered tuple so
 * list-view sorters can compare via index.
 */
export const ZITF_SPEND_BANDS = [
  "under_5k",
  "5k-10k",
  "10k-25k",
  "25k-50k",
  "50k+",
] as const;
export type ZitfSpendBand = (typeof ZITF_SPEND_BANDS)[number];

/** Delay-impact severity for cross-border purchases. */
export type ZitfDelayImpact =
  | "none"
  | "minor"
  | "significant"
  | "deal_breaker";

// ─── row shape ───────────────────────────────────────────────────────────────

/**
 * A single `zitf_responses` row as returned by PostgREST. Only the columns
 * the portal actually touches are listed — historical/deprecated columns
 * (escrow_*, payment_wish, etc.) are deliberately omitted so no UI can
 * write to them by accident.
 */
export type ZitfResponse = {
  id: Uuid;
  submitted_at: IsoDateTime;

  // Channel routing.
  channel: ZitfChannel;
  /** Populated for paper / import rows; null for public digital submissions. */
  collected_by: Uuid | null;

  // Respondent.
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Paper-only context.
  stand_number: string | null;

  // Scored inputs.
  monthly_supplier_spend_band: ZitfSpendBand | null;
  crossborder_supplier_exposure: boolean | null;
  crossborder_delay_impact: ZitfDelayImpact | null;
  paid_first_time_risk_mitigation: string[] | null;
  crossborder_delay_pain: boolean | null;
  fraud_pain: boolean | null;
  consent_followup_contact: boolean;

  // Workflow.
  status: ZitfStatus;
  notes: string | null;

  // Derived columns.
  qualified_score: Numeric;
  is_priority_followup: boolean;
};

/**
 * Shape of a row in `v_zitf_ops_summary`. One row total.
 */
export type ZitfOpsSummary = {
  total_responses: number;
  digital_submissions: number;
  paper_collected: number;
  priority_followups: number;
  qualified_count: number;
  contacted_count: number;
  avg_score: Numeric | null;
  last_24h: number;
};

// ─── insert shapes ───────────────────────────────────────────────────────────

/**
 * Payload accepted by the paper-digitisation form. `channel`, `collected_by`,
 * and the server-managed columns are set by the page's insert call; the form
 * only hands us the hand-entered fields.
 */
export type ZitfPaperFormInput = {
  business_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  stand_number: string;
  monthly_supplier_spend_band: ZitfSpendBand | null;
  crossborder_supplier_exposure: boolean;
  crossborder_delay_impact: ZitfDelayImpact | null;
  paid_first_time_risk_mitigation: string[];
  crossborder_delay_pain: boolean;
  fraud_pain: boolean;
  consent_followup_contact: boolean;
  notes: string | null;
};

// ─── role helpers ────────────────────────────────────────────────────────────

import type { UserRole } from "@/types/ops";

/** Roles permitted to view the ZITF ops surfaces (tile + list + detail). */
export const ZITF_VIEW_ROLES: UserRole[] = [
  "admin",
  "ops",
  "bd",
  "compliance",
];

/** Roles permitted to key in paper / import responses. */
export const ZITF_WRITE_ROLES: UserRole[] = ["admin", "ops"];

/** Roles permitted to update status / notes on an existing response. */
export const ZITF_UPDATE_ROLES: UserRole[] = ["admin", "ops", "bd"];

export function canViewZitf(role: UserRole): boolean {
  return ZITF_VIEW_ROLES.includes(role);
}

export function canWriteZitfPaper(role: UserRole): boolean {
  return ZITF_WRITE_ROLES.includes(role);
}

export function canUpdateZitfRow(role: UserRole): boolean {
  return ZITF_UPDATE_ROLES.includes(role);
}

// ─── display helpers ─────────────────────────────────────────────────────────

export const ZITF_STATUS_LABEL: Record<ZitfStatus, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  pilot_candidate: "Pilot candidate",
  rejected: "Rejected",
};

export const ZITF_CHANNEL_LABEL: Record<ZitfChannel, string> = {
  digital: "Digital",
  paper: "Paper",
  import: "Import",
};

export const ZITF_SPEND_BAND_LABEL: Record<ZitfSpendBand, string> = {
  under_5k: "Under $5k",
  "5k-10k": "$5k – $10k",
  "10k-25k": "$10k – $25k",
  "25k-50k": "$25k – $50k",
  "50k+": "$50k+",
};

export const ZITF_DELAY_IMPACT_LABEL: Record<ZitfDelayImpact, string> = {
  none: "No impact",
  minor: "Minor",
  significant: "Significant",
  deal_breaker: "Deal breaker",
};

/** Free-text options for `paid_first_time_risk_mitigation`. */
export const ZITF_RISK_MITIGATION_OPTIONS = [
  "Pay full upfront",
  "Pay a deposit",
  "Use a broker or middleman",
  "Use escrow / third-party hold",
  "Refuse to deal with unknowns",
  "Other",
] as const;
export type ZitfRiskMitigationOption =
  (typeof ZITF_RISK_MITIGATION_OPTIONS)[number];

/**
 * Central predicate for "should this response show up in the priority-
 * followup bucket?". The DB owns this via a generated column, but the UI
 * replicates it so we can flag freshly-entered paper rows before a refresh
 * round-trip returns the server-side value.
 */
export function computeIsPriorityFollowup(
  row: Pick<
    ZitfResponse,
    | "consent_followup_contact"
    | "monthly_supplier_spend_band"
    | "paid_first_time_risk_mitigation"
    | "crossborder_delay_impact"
  >,
): boolean {
  if (!row.consent_followup_contact) return false;
  const spend = row.monthly_supplier_spend_band;
  if (spend !== "10k-25k" && spend !== "25k-50k" && spend !== "50k+") {
    return false;
  }
  const usesBroker = (row.paid_first_time_risk_mitigation ?? []).includes(
    "Use a broker or middleman",
  );
  const delayHit =
    row.crossborder_delay_impact === "significant" ||
    row.crossborder_delay_impact === "deal_breaker";
  return usesBroker || delayHit;
}

/** Table name registry for typed supabase calls. */
export const ZITF_TABLES = {
  responses: "zitf_responses",
  summary_view: "v_zitf_ops_summary",
} as const;
