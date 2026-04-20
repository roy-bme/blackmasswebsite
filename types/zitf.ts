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
  | "rejected"
  | "duplicate";

/**
 * Spend bands used by the qualification scoring. Kept as an ordered tuple so
 * list-view sorters can compare via index. Values match the DB check
 * constraint exactly — do not change without a migration.
 */
export const ZITF_SPEND_BANDS = [
  "<2k",
  "2k-10k",
  "10k-25k",
  "25k-50k",
  "50k+",
] as const;
export type ZitfSpendBand = (typeof ZITF_SPEND_BANDS)[number];

/** Delay-impact severity for cross-border purchases. */
export type ZitfDelayImpact =
  | "no_impact"
  | "minor"
  | "significant"
  | "deal_breaker";

/**
 * Supplier location allowlist. Mirrors `SUPPLIER_LOCATIONS` in
 * `supabase/functions/zitf-submit/index.ts` exactly. The "foreign" subset
 * drives the cross-border exposure flag: any value in
 * `ZITF_FOREIGN_SUPPLIER_LOCATIONS` counts as a cross-border supplier.
 */
export const ZITF_SUPPLIER_LOCATIONS = [
  "Bulawayo",
  "Harare",
  "Other Zim city",
  "South Africa",
  "China",
  "Dubai / UAE",
  "UK / Europe",
  "Other",
] as const;
export type ZitfSupplierLocation = (typeof ZITF_SUPPLIER_LOCATIONS)[number];

export const ZITF_FOREIGN_SUPPLIER_LOCATIONS: ReadonlyArray<ZitfSupplierLocation> = [
  "South Africa",
  "China",
  "Dubai / UAE",
  "UK / Europe",
  "Other",
];

/** True when the respondent lists any foreign supplier location. */
export function hasCrossborderSupplierExposure(
  locations: readonly string[] | null | undefined,
): boolean {
  if (!locations || locations.length === 0) return false;
  return locations.some((loc) =>
    (ZITF_FOREIGN_SUPPLIER_LOCATIONS as ReadonlyArray<string>).includes(loc),
  );
}

/**
 * Sector is free text in both the digital and paper forms — the DB does
 * not constrain it. Kept as `string | null` on the row and as a plain
 * input on the paper form for parity with the digital submission path.
 */

/** Team-size bucket. Mirrors `TEAM_SIZES` in the edge function. */
export const ZITF_TEAM_SIZE_BANDS = [
  "1-5",
  "6-20",
  "21-50",
  "51-200",
  "200+",
] as const;
export type ZitfTeamSizeBand = (typeof ZITF_TEAM_SIZE_BANDS)[number];

/**
 * Payment methods used to pay suppliers / receive from customers. Mirrors
 * `PAYMENT_METHODS` in the edge function.
 */
export const ZITF_PAYMENT_METHODS = [
  "Cash (USD)",
  "Cash (ZiG)",
  "Bank transfer (local)",
  "Bank transfer (foreign)",
  "EcoCash",
  "InnBucks",
  "ZIPIT",
  "Mukuru / WorldRemit",
  "Crypto / USDT",
  "Card (POS / online)",
] as const;
export type ZitfPaymentMethod = (typeof ZITF_PAYMENT_METHODS)[number];

/** Top-headaches allowlist. Mirrors `HEADACHES` in the edge function. */
export const ZITF_PAIN_HEADACHES = [
  "Payment delays",
  "High transaction fees",
  "Transaction limits",
  "Fraud / scams",
  "No proof of payment",
  "Parallel rate disputes",
  "Cross-border FX friction",
  "Slow reconciliation",
  "Supplier trust",
] as const;
export type ZitfPainHeadache = (typeof ZITF_PAIN_HEADACHES)[number];

/** Customer-type allowlist. Mirrors `CUSTOMER_TYPES` in the edge function. */
export const ZITF_CUSTOMER_TYPES = [
  "Individuals",
  "Other businesses (B2B)",
  "Government / NGO",
  "Export market",
] as const;
export type ZitfCustomerType = (typeof ZITF_CUSTOMER_TYPES)[number];

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
  decision_maker_name: string | null;
  email: string | null;
  phone: string | null;

  // Paper-only context.
  stand_number: string | null;

  // Business profile.
  sector: string | null;
  team_size_band: ZitfTeamSizeBand | null;
  supplier_locations: string[] | null;
  customer_types: string[] | null;
  pay_suppliers_methods: string[] | null;
  receive_customers_methods: string[] | null;
  pain_top_headaches: string[] | null;

  // Scored inputs.
  monthly_supplier_spend_band: ZitfSpendBand | null;
  crossborder_delay_impact: ZitfDelayImpact | null;
  paid_first_time_risk_mitigation: string[] | null;
  pain_crossborder_delay: boolean | null;
  pain_fraud_loss: boolean | null;
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
  decision_maker_name: string;
  email: string | null;
  phone: string | null;
  stand_number: string;
  sector: string | null;
  team_size_band: ZitfTeamSizeBand | null;
  supplier_locations: string[];
  customer_types: string[];
  pay_suppliers_methods: string[];
  receive_customers_methods: string[];
  pain_top_headaches: string[];
  monthly_supplier_spend_band: ZitfSpendBand | null;
  crossborder_delay_impact: ZitfDelayImpact | null;
  paid_first_time_risk_mitigation: string[];
  pain_crossborder_delay: boolean;
  pain_fraud_loss: boolean;
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
  duplicate: "Duplicate",
};

export const ZITF_CHANNEL_LABEL: Record<ZitfChannel, string> = {
  digital: "Digital",
  paper: "Paper",
  import: "Import",
};

export const ZITF_SPEND_BAND_LABEL: Record<ZitfSpendBand, string> = {
  "<2k": "Under $2k",
  "2k-10k": "$2k – $10k",
  "10k-25k": "$10k – $25k",
  "25k-50k": "$25k – $50k",
  "50k+": "$50k+",
};

export const ZITF_DELAY_IMPACT_LABEL: Record<ZitfDelayImpact, string> = {
  no_impact: "No impact",
  minor: "Minor",
  significant: "Significant",
  deal_breaker: "Deal breaker",
};

/**
 * Risk-mitigation options. Mirrors `RISK_MITIGATION` in the edge function
 * exactly — the scoring function keys off `"Use a broker or middleman"`.
 */
export const ZITF_RISK_MITIGATION_OPTIONS = [
  "Pay deposit only",
  "Pay on delivery",
  "Request references",
  "Use a broker or middleman",
  "Take the risk",
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
