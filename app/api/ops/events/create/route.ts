import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  name?: string;
  date?: string;
  end_date?: string | null;
  location?: string | null;
  type?: string | null;
  priority?: number | null;
  notes?: string | null;
};

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/events", roles: ["admin", "bd", "ops"] },
    async ({ service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return jsonError(400, "name_required");
      if (!body.date) return jsonError(400, "date_required");

      const priority = body.priority ?? null;
      if (priority != null && (priority < 1 || priority > 5)) {
        return jsonError(400, "invalid_priority");
      }

      const { data, error } = await service
        .from("events")
        .insert({
          name,
          date: body.date,
          end_date: body.end_date || null,
          location: body.location ?? null,
          type: body.type ?? null,
          priority,
          notes: body.notes ?? null,
          status: "upcoming",
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
