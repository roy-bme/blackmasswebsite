import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  id?: string;
  status?: "approved" | "declined" | "pending";
};

export async function POST(request: Request) {
  return withOpsWrite(request, { module: "/indaba/intros", roles: ["admin", "ops", "bd"] }, async ({ service }) => {
    const body = await readJson<Body>(request);
    if (!body) return jsonError(400, "invalid_json");
    if (!body.id) return jsonError(400, "id_required");
    if (!body.status || !["approved", "declined", "pending"].includes(body.status)) return jsonError(400, "invalid_status");

    const patch = {
      status: body.status,
      roy_approved: body.status === "approved",
    };

    const { error } = await service.from("introductions").update(patch).eq("id", body.id);
    if (error) return jsonError(500, "db_error");
    return jsonOk({ ok: true });
  });
}
