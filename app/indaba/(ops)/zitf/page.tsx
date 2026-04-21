import Button from "@/components/ops/ui/Button";
import ZitfResponseList from "@/components/ops/Zitf/ZitfResponseList";
import { requireModuleAccess } from "@/lib/ops/auth";
import { resolveFlash } from "@/lib/ops/flash";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ZITF_TABLES,
  canWriteZitfPaper,
  type ZitfResponse,
} from "@/types/zitf";

export const dynamic = "force-dynamic";

type ZitfListPageProps = {
  searchParams: { flash?: string };
};

/**
 * Staff-facing list of every ZITF 2026 stand response. Sortable, filterable,
 * CSV-exportable. Row-click opens the detail dialog, where ops/bd/admin can
 * update status + notes (gated by RLS + the update-role helper).
 */
export default async function ZitfListPage({
  searchParams,
}: ZitfListPageProps) {
  const user = await requireModuleAccess("/indaba/zitf");
  const flash = resolveFlash(searchParams.flash);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(ZITF_TABLES.responses)
    .select(
      [
        "id",
        "submitted_at",
        "channel",
        "collected_by",
        "business_name",
        "decision_maker_name",
        "email",
        "phone",
        "stand_number",
        "sector",
        "team_size_band",
        "supplier_locations",
        "customer_types",
        "pay_suppliers_methods",
        "receive_customers_methods",
        "pain_top_headaches",
        "monthly_supplier_spend_band",
        "crossborder_delay_impact",
        "paid_first_time_risk_mitigation",
        "pain_crossborder_delay",
        "pain_fraud_loss",
        "consent_followup_contact",
        "status",
        "notes",
        "qualified_score",
        "is_priority_followup",
      ].join(", "),
    )
    .order("submitted_at", { ascending: false });

  const rows = (data ?? []) as unknown as ZitfResponse[];
  const canCreatePaper = canWriteZitfPaper(user.role);

  return (
    <div className="space-y-4">
      {flash ? (
        <div
          role="status"
          className="border border-zimx-green/30 bg-zimx-green/5 px-4 py-3 font-mono text-[12px] uppercase tracking-tag text-zimx-green"
        >
          {flash}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-[13px] uppercase tracking-tag text-zinc-500">
            ZITF 2026 responses
          </h1>
          <p className="mt-1 text-[14px] text-zimx-black">
            {rows.length.toLocaleString()} total · sort, filter, export
          </p>
        </div>
        {canCreatePaper ? (
          <Button variant="primary" size="sm" href="/indaba/zitf/new-paper">
            + New paper response
          </Button>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="border border-zimx-red/30 bg-zimx-red/5 px-4 py-3 font-mono text-[12px] uppercase tracking-tag text-zimx-red"
        >
          Failed to load responses: {error.message}
        </div>
      ) : (
        <ZitfResponseList rows={rows} currentUserRole={user.role} />
      )}
    </div>
  );
}
