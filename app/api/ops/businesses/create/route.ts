import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  name?: string;
  sector?: string;
  type?: "formal" | "informal";
  zone_id?: string | null;
  lat?: number;
  lng?: number;
  address?: string | null;
  est_monthly_volume?: number | null;
  notes?: string | null;
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
      if (!body.sector) return jsonError(400, "sector_required");
      if (typeof body.lat !== "number" || typeof body.lng !== "number") {
        return jsonError(400, "coords_required");
      }

      const { data, error } = await service
        .from("businesses")
        .insert({
          name,
          sector: body.sector,
          type: body.type ?? "formal",
          zone_id: body.zone_id ?? null,
          lat: body.lat,
          lng: body.lng,
          address: body.address ?? null,
          est_monthly_volume: body.est_monthly_volume ?? null,
          notes: body.notes ?? null,
          mapped_by: user.id,
          onboarding_stage: "identified",
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
