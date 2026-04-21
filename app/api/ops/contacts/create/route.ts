import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  business_id?: string;
  name?: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  warmth_level?: string | null;
};

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/directory", roles: ["admin", "ops", "bd"] },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return jsonError(400, "name_required");

      const { data, error } = await service
        .from("contacts")
        .insert({
          business_id: body.business_id ?? null,
          name,
          title: body.title ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          warmth_level: body.warmth_level ?? null,
          introduced_by: user.id,
        })
        .select("*")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ contact: data });
    },
  );
}
