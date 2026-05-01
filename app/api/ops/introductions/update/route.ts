import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  id?: string;
  status?: "approved" | "declined" | "pending";
  notes?: string | null;
};

export async function POST(request: Request) {
  return withOpsWrite(request, { module: "/indaba/intros", roles: ["admin", "ops", "bd"] }, async ({ service }) => {
    const body = await readJson<Body>(request);
    if (!body) return jsonError(400, "invalid_json");
    if (!body.id) return jsonError(400, "id_required");

    const patch: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!["approved", "declined", "pending"].includes(body.status)) {
        return jsonError(400, "invalid_status");
      }
      patch.status = body.status;
      patch.roy_approved = body.status === "approved";
    }

    if (body.notes !== undefined) {
      const trimmed = typeof body.notes === "string" ? body.notes.trim() : "";
      patch.notes = trimmed.length > 0 ? trimmed.slice(0, 4000) : null;
    }

    if (Object.keys(patch).length === 0) {
      return jsonError(400, "no_fields");
    }

    const { error } = await service.from("introductions").update(patch).eq("id", body.id);
    if (error) return jsonError(500, "db_error");
    return jsonOk({ ok: true });
  });
}
