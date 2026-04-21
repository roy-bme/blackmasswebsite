import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";
import type { ZitfStatus } from "@/types/zitf";

type Body = {
  id?: string;
  status?: ZitfStatus;
  notes?: string | null;
};

const STATUS_VALUES = new Set<string>([
  "new",
  "qualified",
  "contacted",
  "pilot_candidate",
  "rejected",
  "duplicate",
]);

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/zitf", roles: ["admin", "ops", "bd"] },
    async ({ service }) => {
      const body = await readJson<Body>(request);
      if (!body || !body.id) return jsonError(400, "invalid_json");

      if (!body.status || !STATUS_VALUES.has(body.status)) {
        return jsonError(400, "invalid_status");
      }

      const patch = {
        status: body.status,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      };

      const { data, error } = await service
        .from("zitf_responses")
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
