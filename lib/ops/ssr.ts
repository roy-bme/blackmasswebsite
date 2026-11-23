/**
 * Synthetic Merchant Panel (SSR) types. The agent writes ssr_runs.summary in this shape
 * (see zimxfinance/Indaba src/lib/ssr/plan.ts).
 */

export type Dist = { pmf: number[]; mean: number; n_records: number; n_groups: number };
export type SegmentDists = { A: Dist | null; B: Dist | null };
export type VariantSummary = SegmentDists & {
  icp: SegmentDists;
  non_icp: SegmentDists;
  by_sector: Record<string, SegmentDists>;
  by_zone: Record<string, SegmentDists>;
};

export type RankingRow = {
  code: string;
  segment: "all" | "icp" | "non_icp";
  a_mean: number | null;
  a_vs_c0: number | null;
  b_mean: number | null;
};

export type PainComparison = {
  concept: string;
  tagged: {
    base: SegmentDists;
    no_pain: SegmentDists;
    a_diff: number | null;
    b_diff: number | null;
    n_records: number;
  };
  untagged_noise: { a_diff: number | null; b_diff: number | null; n_records: number };
  all: { a_diff: number | null; b_diff: number | null };
};

export type CalibrationRecord = {
  business_id: string;
  persona: Record<string, unknown>;
  concepts: Record<string, SegmentDists>;
};

export type SsrSummary = {
  generated_at: string;
  records: number;
  persona_groups: number;
  icp_sectors: string[];
  control: string;
  concepts: Record<string, { title: string; base: VariantSummary; no_pain?: VariantSummary }>;
  ranking: RankingRow[];
  pain_compare: PainComparison[];
  calibration: { n: number; label: string; records: CalibrationRecord[] };
  dropped_samples: number;
};

export type SsrEstimate = {
  calls: number;
  calls_by_part: Record<string, number>;
  expected_usd: number;
  worst_case_usd: number;
  breakdown_usd: Record<string, { expected: number; worst: number }>;
  fits_cap: boolean;
  cap_reason: string;
  monthly_spent_usd?: number;
};

export type SsrRun = {
  id: string;
  created_at: string;
  status:
    | "estimate_requested"
    | "awaiting_approval"
    | "approved"
    | "running"
    | "done"
    | "failed"
    | "capped"
    | "cancelled";
  scope: string;
  concept_codes: string[];
  pain_compare_codes: string[];
  include_calibration: boolean;
  params: Record<string, unknown>;
  persona_record_count: number | null;
  persona_group_count: number | null;
  estimate: SsrEstimate | null;
  estimated_cost_usd: number | null;
  cost_cap_usd: number | null;
  actual_cost_usd: number;
  pii_log: Record<string, unknown> | null;
  summary: SsrSummary | null;
  error_message: string | null;
  approved_at: string | null;
  completed_at: string | null;
};

export type SsrConcept = {
  code: string;
  title: string;
  body: string;
  price_construct: boolean;
  price_text: string | null;
  params: Record<string, unknown>;
  is_control: boolean;
  active: boolean;
  sort_order: number;
  version: number;
};

export type SsrAnchorSet = {
  code: string;
  construct: "A" | "B";
  anchors: string[];
  active: boolean;
  version: number;
};

export type SsrObjection = {
  id: string;
  concept_code: string;
  variant: string;
  cluster_idx: number;
  label: string;
  share: number;
  weight: number;
  n_mentions: number;
  quotes: { response_id: string; quote: string; sector: string; zone: string }[];
};

export const SSR_BANNER =
  "Synthetic responses. For ranking and objection mining, not customer evidence.";

/** Same rules as ssr_copy_ok() in the database and copyRuleViolations() in the agent. */
export function copyRuleViolations(text: string): string[] {
  const rules: [RegExp, string][] = [
    [/stable\s*-?\s*coin/i, 'says "stablecoin"'],
    [/\bzimra\b/i, "mentions ZIMRA"],
    [/\btax(es|ed|ation)?\b/i, "tax framing"],
    [/\bvat\b/i, "VAT framing"],
    [/\brbz\b/i, "mentions the RBZ"],
    [/reserve\s+bank/i, "mentions the Reserve Bank"],
    [/\bzig\b/i, "positions against ZiG"],
    [/\bzwg\b/i, "positions against ZWG"],
    [/local\s+currency/i, "positions against local currency"],
    [/one[\s-]*(for|to)[\s-]*one/i, "states a backing ratio"],
    [/\b1\s*(:|[\s-]*(for|to)[\s-]*)\s*1\b/i, "states a backing ratio"],
    [/\breserves?\b/i, "describes the reserve"],
    [/\bbacked\s+by\b/i, "describes what backs it (say "USDC-backed")"],
    [/fully[\s-]+backed/i, "describes the backing"],
  ];
  return rules.filter(([re]) => re.test(text)).map(([, why]) => why);
}

export function fmtMean(x: number | null | undefined): string {
  return x === null || x === undefined ? "—" : x.toFixed(2);
}

export function fmtDiff(x: number | null | undefined): string {
  if (x === null || x === undefined) return "—";
  return `${x > 0 ? "+" : ""}${x.toFixed(2)}`;
}

export function fmtUsd(x: number | null | undefined): string {
  return x === null || x === undefined ? "—" : `US$${Number(x).toFixed(2)}`;
}
