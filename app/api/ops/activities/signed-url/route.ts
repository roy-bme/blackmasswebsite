import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = { paths?: string[] };

const TTL_SECONDS = 300; // 5 minutes
const MAX_PATHS = 50;

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/feed", rateLimit: true },
    async ({ service }) => {
      const body = await readJson<Body>(request);
      if (!body || !Array.isArray(body.paths)) {
        return jsonError(400, "invalid_json");
      }
      const paths = body.paths
        .filter((p): p is string => typeof p === "string")
        .filter((p) => !p.startsWith("/") && !p.includes(".."))
        .slice(0, MAX_PATHS);

      if (paths.length === 0) return jsonOk({ urls: {} });

      const { data, error } = await service.storage
        .from("photos")
        .createSignedUrls(paths, TTL_SECONDS);

      if (error) return jsonError(500, "signed_url_error");

      const urls: Record<string, string | null> = {};
      for (const row of data ?? []) {
        urls[row.path ?? ""] = row.signedUrl ?? null;
      }
      return jsonOk({ urls });
    },
  );
}
