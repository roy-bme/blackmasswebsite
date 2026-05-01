import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  id?: string;
  patch?: Record<string, unknown>;
};

// Columns the ops overview tab can mutate. Everything else is server- or
// admin-owned.
const ALLOWED_COLUMNS = new Set<string>([
  "name",
  "sector",
  "type",
  "sub_sector",
  "zone_id",
  "address",
  "est_monthly_volume",
  "decision_maker_name",
  "decision_maker_title",
  "phone",
  "email",
  "linkedin",
  "notes",
  "key_suppliers",
  "key_customers",
  "pain_points",
  "zimx_fit_score",
  "launch_6",
  "photos",
  "onboarding_stage",
]);

const ADMIN_ONLY_COLUMNS = new Set<string>(["onboarding_stage", "launch_6"]);

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/directory", roles: ["admin", "ops", "bd"] },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body || !body.id || typeof body.id !== "string" || !body.patch) {
        return jsonError(400, "invalid_body");
      }

      const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body.patch)) {
        if (!ALLOWED_COLUMNS.has(key)) continue;
        if (ADMIN_ONLY_COLUMNS.has(key) && user.role !== "admin") continue;
        patch[key] = value;
      }

      if (Object.keys(patch).length === 0) {
        return jsonError(400, "no_allowed_fields");
      }

      const { data, error } = await service
        .from("businesses")
        .update(patch)
        .eq("id", body.id)
        .select("id")
        .maybeSingle();

      if (error) return jsonError(500, "db_error");
      if (!data) return jsonError(404, "not_found");
      return jsonOk({ id: data.id });
    },
  );
}
