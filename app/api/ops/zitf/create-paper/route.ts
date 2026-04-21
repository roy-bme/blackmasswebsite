import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";
import {
  ZITF_CUSTOMER_TYPES,
  ZITF_PAIN_HEADACHES,
  ZITF_PAYMENT_METHODS,
  ZITF_RISK_MITIGATION_OPTIONS,
  ZITF_SPEND_BANDS,
  ZITF_SUPPLIER_LOCATIONS,
  ZITF_TEAM_SIZE_BANDS,
  type ZitfPaperFormInput,
} from "@/types/zitf";

const DELAY_IMPACTS = new Set<string>([
  "no_impact",
  "minor",
  "significant",
  "deal_breaker",
]);

function sanitiseArray<T extends string>(
  input: unknown,
  allowed: ReadonlyArray<T>,
): T[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(allowed as ReadonlyArray<string>);
  return input
    .filter((v): v is T => typeof v === "string" && set.has(v))
    .slice(0, allowed.length);
}

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/zitf", roles: ["admin", "ops"] },
    async ({ user, service }) => {
      const body = await readJson<Partial<ZitfPaperFormInput>>(request);
      if (!body) return jsonError(400, "invalid_json");

      const businessName = typeof body.business_name === "string" ? body.business_name.trim() : "";
      const decisionMaker = typeof body.decision_maker_name === "string" ? body.decision_maker_name.trim() : "";
      const standNumber = typeof body.stand_number === "string" ? body.stand_number.trim() : "";
      if (!businessName || !decisionMaker || !standNumber) {
        return jsonError(400, "missing_required");
      }

      const teamSize = body.team_size_band;
      if (teamSize != null && !(ZITF_TEAM_SIZE_BANDS as ReadonlyArray<string>).includes(teamSize)) {
        return jsonError(400, "invalid_team_size");
      }

      const spend = body.monthly_supplier_spend_band;
      if (spend != null && !(ZITF_SPEND_BANDS as ReadonlyArray<string>).includes(spend)) {
        return jsonError(400, "invalid_spend_band");
      }

      const delay = body.crossborder_delay_impact;
      if (delay != null && !DELAY_IMPACTS.has(delay)) {
        return jsonError(400, "invalid_delay_impact");
      }

      const payload = {
        channel: "paper",
        collected_by: user.id,
        business_name: businessName,
        decision_maker_name: decisionMaker,
        email: body.email ?? null,
        phone: body.phone ?? null,
        stand_number: standNumber,
        sector: body.sector ?? null,
        team_size_band: teamSize ?? null,
        supplier_locations: sanitiseArray(body.supplier_locations, ZITF_SUPPLIER_LOCATIONS),
        customer_types: sanitiseArray(body.customer_types, ZITF_CUSTOMER_TYPES),
        pay_suppliers_methods: sanitiseArray(body.pay_suppliers_methods, ZITF_PAYMENT_METHODS),
        receive_customers_methods: sanitiseArray(body.receive_customers_methods, ZITF_PAYMENT_METHODS),
        pain_top_headaches: sanitiseArray(body.pain_top_headaches, ZITF_PAIN_HEADACHES),
        monthly_supplier_spend_band: spend ?? null,
        crossborder_delay_impact: delay ?? null,
        paid_first_time_risk_mitigation: sanitiseArray(
          body.paid_first_time_risk_mitigation,
          ZITF_RISK_MITIGATION_OPTIONS,
        ),
        pain_crossborder_delay: Boolean(body.pain_crossborder_delay),
        pain_fraud_loss: Boolean(body.pain_fraud_loss),
        consent_followup_contact: Boolean(body.consent_followup_contact),
        notes: body.notes ?? null,
      };

      const { data, error } = await service
        .from("zitf_responses")
        .insert(payload)
        .select("id, qualified_score, is_priority_followup")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk(data);
    },
  );
}
