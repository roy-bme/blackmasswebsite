import { jsonError, jsonOk, withOpsWrite } from "@/lib/server/ops-handler";

const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/directory", roles: ["admin", "ops"] },
    async ({ user, service }) => {
      const form = await request.formData().catch(() => null);
      if (!form) return jsonError(400, "invalid_form");

      const businessId = String(form.get("business_id") ?? "");
      if (!businessId) return jsonError(400, "business_id_required");

      const file = form.get("file");
      if (!(file instanceof File)) return jsonError(400, "missing_file");
      if (!ALLOWED_MIME.has(file.type)) return jsonError(415, "unsupported_media_type");
      if (file.size > MAX_BYTES) return jsonError(413, "file_too_large");

      const ext = file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";

      const path = `${user.id}/business-${businessId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error: uploadError } = await service.storage
        .from("photos")
        .upload(path, bytes, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) return jsonError(500, "upload_failed");

      const { data: existing, error: readError } = await service
        .from("businesses")
        .select("photos")
        .eq("id", businessId)
        .maybeSingle();
      if (readError || !existing) return jsonError(404, "not_found");

      const nextPhotos = [...((existing.photos as string[] | null) ?? []), path];

      const { error: updateError } = await service
        .from("businesses")
        .update({ photos: nextPhotos })
        .eq("id", businessId);
      if (updateError) return jsonError(500, "db_error");

      return jsonOk({ path });
    },
  );
}
