import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  contact_name?: string;
  role?: string | null;
  business?: string | null;
  business_id?: string | null;
  how_connected?: string | null;
  why_relevant?: string | null;
  pain_points_identified?: string[] | null;
  cross_border?: boolean;
  warmth?: "cold" | "warm" | "hot";
  recommended_action?: string | null;
};

const WARMTH_VALUES: Array<Body["warmth"]> = ["cold", "warm", "hot"];

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/intros", roles: ["admin", "bd"] },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const contactName = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
      if (!contactName) return jsonError(400, "contact_name_required");
      if (contactName.length > 200) return jsonError(400, "contact_name_too_long");

      const warmth = body.warmth ?? "cold";
      if (!WARMTH_VALUES.includes(warmth)) return jsonError(400, "invalid_warmth");

      const { data, error } = await service
        .from("introductions")
        .insert({
          contact_name: contactName,
          role: body.role ?? null,
          business: body.business ?? null,
          business_id: body.business_id ?? null,
          introduced_by: user.id,
          how_connected: body.how_connected ?? null,
          why_relevant: body.why_relevant ?? null,
          pain_points_identified: body.pain_points_identified ?? null,
          cross_border: Boolean(body.cross_border),
          warmth,
          recommended_action: body.recommended_action ?? null,
          status: "identified",
          // Never allow client to set roy_approved.
          roy_approved: false,
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
