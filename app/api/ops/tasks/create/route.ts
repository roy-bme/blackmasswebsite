import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  linked_business_id?: string | null;
  linked_intro_id?: string | null;
};

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/feed", roles: ["admin", "ops", "bd"] },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return jsonError(400, "title_required");

      const { data, error } = await service
        .from("tasks")
        .insert({
          title,
          description: body.description ?? null,
          assigned_to: body.assigned_to ?? null,
          created_by: user.id,
          due_date: body.due_date ?? null,
          linked_business_id: body.linked_business_id ?? null,
          linked_intro_id: body.linked_intro_id ?? null,
          status: "open",
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
