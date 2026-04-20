import {
  ZITF_CHANNEL_LABEL,
  ZITF_DELAY_IMPACT_LABEL,
  ZITF_SPEND_BAND_LABEL,
  ZITF_STATUS_LABEL,
  hasCrossborderSupplierExposure,
  type ZitfResponse,
} from "@/types/zitf";

/**
 * Columns emitted by the list view CSV export. Order matters — the header
 * row and every data row follow this sequence exactly.
 */
const COLUMNS: Array<{
  header: string;
  accessor: (row: ZitfResponse) => string | number | boolean | null;
}> = [
  { header: "Submitted at", accessor: (r) => r.submitted_at },
  { header: "Channel", accessor: (r) => ZITF_CHANNEL_LABEL[r.channel] },
  { header: "Status", accessor: (r) => ZITF_STATUS_LABEL[r.status] },
  { header: "Business", accessor: (r) => r.business_name ?? "" },
  { header: "Decision-maker", accessor: (r) => r.decision_maker_name ?? "" },
  { header: "Email", accessor: (r) => r.email ?? "" },
  { header: "Phone", accessor: (r) => r.phone ?? "" },
  { header: "Stand number", accessor: (r) => r.stand_number ?? "" },
  { header: "Sector", accessor: (r) => r.sector ?? "" },
  { header: "Team size", accessor: (r) => r.team_size_band ?? "" },
  {
    header: "Supplier locations",
    accessor: (r) => (r.supplier_locations ?? []).join("; "),
  },
  {
    header: "Customer types",
    accessor: (r) => (r.customer_types ?? []).join("; "),
  },
  {
    header: "Pay suppliers (methods)",
    accessor: (r) => (r.pay_suppliers_methods ?? []).join("; "),
  },
  {
    header: "Receive from customers (methods)",
    accessor: (r) => (r.receive_customers_methods ?? []).join("; "),
  },
  {
    header: "Top headaches",
    accessor: (r) => (r.pain_top_headaches ?? []).join("; "),
  },
  {
    header: "Spend band",
    accessor: (r) =>
      r.monthly_supplier_spend_band
        ? ZITF_SPEND_BAND_LABEL[r.monthly_supplier_spend_band]
        : "",
  },
  {
    header: "Cross-border supplier",
    accessor: (r) => {
      if (!r.supplier_locations || r.supplier_locations.length === 0) return "";
      return hasCrossborderSupplierExposure(r.supplier_locations) ? "yes" : "no";
    },
  },
  {
    header: "Delay impact",
    accessor: (r) =>
      r.crossborder_delay_impact
        ? ZITF_DELAY_IMPACT_LABEL[r.crossborder_delay_impact]
        : "",
  },
  {
    header: "Risk mitigation",
    accessor: (r) => (r.paid_first_time_risk_mitigation ?? []).join("; "),
  },
  {
    header: "Cross-border delay pain",
    accessor: (r) => (r.pain_crossborder_delay ? "yes" : "no"),
  },
  {
    header: "Fraud loss pain",
    accessor: (r) => (r.pain_fraud_loss ? "yes" : "no"),
  },
  {
    header: "Consent followup",
    accessor: (r) => (r.consent_followup_contact ? "yes" : "no"),
  },
  { header: "Qualified score", accessor: (r) => Math.round(r.qualified_score) },
  {
    header: "Priority followup",
    accessor: (r) => (r.is_priority_followup ? "yes" : "no"),
  },
  { header: "Notes", accessor: (r) => r.notes ?? "" },
];

function escapeCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "boolean" ? (value ? "yes" : "no") : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serialise a set of responses to an RFC 4180 CSV string. */
export function responsesToCsv(rows: ZitfResponse[]): string {
  const header = COLUMNS.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) => COLUMNS.map((c) => escapeCell(c.accessor(row))).join(","))
    .join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

/**
 * Browser-only helper: assemble a Blob and trigger a download. Callers
 * generate the filename (typically with a date stamp) so the CSV util
 * itself stays pure.
 */
export function triggerCsvDownload(csv: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
