import {
  jsonError,
  jsonOk,
  withOpsWrite,
} from "@/lib/server/ops-handler";

const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/feed" },
    async ({ user, service }) => {
      const form = await request.formData().catch(() => null);
      if (!form) return jsonError(400, "invalid_form");

      const file = form.get("file");
      const bucket = String(form.get("bucket") ?? "photos");
      if (bucket !== "photos") return jsonError(400, "invalid_bucket");

      if (!(file instanceof File)) return jsonError(400, "missing_file");
      if (!ALLOWED_MIME.has(file.type)) return jsonError(415, "unsupported_media_type");
      if (file.size > MAX_BYTES) return jsonError(413, "file_too_large");
      if (file.size === 0) return jsonError(400, "empty_file");

      const ext = file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";
      const safeName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const { error } = await service.storage
        .from("photos")
        .upload(path, bytes, {
          contentType: file.type,
          upsert: false,
        });

      if (error) return jsonError(500, "upload_failed");

      return jsonOk({ path });
    },
  );
}
