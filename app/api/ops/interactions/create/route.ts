import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type InteractionType = "call" | "visit" | "whatsapp" | "email" | "other";

type Body = {
  business_id?: string;
  type?: InteractionType;
  outcome?: string;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
};

const ALLOWED_TYPES: InteractionType[] = ["call", "visit", "whatsapp", "email", "other"];

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { roles: ["admin", "ops", "bd"], module: "/indaba/directory" },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const businessId = typeof body.business_id === "string" ? body.business_id.trim() : "";
      if (!businessId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) {
        return jsonError(400, "invalid_business_id");
      }

      const type = body.type;
      if (!type || !ALLOWED_TYPES.includes(type)) return jsonError(400, "invalid_type");

      const parseDate = (value?: string) => {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "invalid";
        return trimmed;
      };

      const nextActionDate = parseDate(body.next_action_date);
      if (nextActionDate === "invalid") return jsonError(400, "invalid_next_action_date");

      const { data, error } = await service
        .from("interactions")
        .insert({
          business_id: businessId,
          logged_by: user.id,
          type,
          outcome: typeof body.outcome === "string" ? body.outcome.trim() || null : null,
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          next_action: typeof body.next_action === "string" ? body.next_action.trim() || null : null,
          next_action_date: nextActionDate,
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ success: true, id: data.id });
    },
  );
}
