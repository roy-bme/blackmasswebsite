import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = {
  supplier_id?: string;
  buyer_id?: string;
  product?: string;
  est_monthly_volume?: number | null;
  payment_method?: string | null;
  payment_frequency?: string | null;
};

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/graph", roles: ["admin", "ops"] },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      if (!body.supplier_id || !body.buyer_id) return jsonError(400, "endpoints_required");
      if (body.supplier_id === body.buyer_id) return jsonError(400, "endpoints_must_differ");
      const product = typeof body.product === "string" ? body.product.trim() : "";
      if (!product) return jsonError(400, "product_required");

      const { data, error } = await service
        .from("supply_chain_links")
        .insert({
          supplier_id: body.supplier_id,
          buyer_id: body.buyer_id,
          product,
          est_monthly_volume: body.est_monthly_volume ?? null,
          payment_method: body.payment_method ?? null,
          payment_frequency: body.payment_frequency ?? null,
          mapped_by: user.id,
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
