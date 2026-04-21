import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";
import { filterAttachments } from "@/lib/ops/attachments";
import type { ActivityChannel, ActivityType } from "@/types/ops";

type Body = {
  channel?: ActivityChannel;
  type?: ActivityType;
  content?: string;
  attachments?: string[];
  parent_id?: string | null;
};

const ALLOWED_CHANNELS: ActivityChannel[] = [
  "ground_ops",
  "bd_networking",
  "admin",
];

const ALLOWED_TYPES: ActivityType[] = [
  "daily_report",
  "comment",
  "task_created",
  "photo",
  "event_log",
  "status_update",
];

export async function POST(request: Request) {
  return withOpsWrite(
    request,
    { module: "/indaba/feed" },
    async ({ user, service }) => {
      const body = await readJson<Body>(request);
      if (!body) return jsonError(400, "invalid_json");

      const channel = body.channel;
      if (!channel || !ALLOWED_CHANNELS.includes(channel)) {
        return jsonError(400, "invalid_channel");
      }
      // Only admins may post into the `admin` channel.
      if (channel === "admin" && user.role !== "admin") {
        return jsonError(403, "forbidden_channel");
      }

      const type = body.type;
      if (!type || !ALLOWED_TYPES.includes(type)) {
        return jsonError(400, "invalid_type");
      }

      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (content.length > 10_000) return jsonError(400, "content_too_long");

      const attachments = filterAttachments(body.attachments);

      const parentId =
        typeof body.parent_id === "string" && body.parent_id.length > 0
          ? body.parent_id
          : null;

      if (!content && attachments.length === 0) {
        return jsonError(400, "empty_activity");
      }

      const { data, error } = await service
        .from("activities")
        .insert({
          user_id: user.id,
          channel,
          type,
          content,
          attachments: attachments.length > 0 ? attachments : null,
          parent_id: parentId,
        })
        .select("id")
        .single();

      if (error) return jsonError(500, "db_error");
      return jsonOk({ id: data.id });
    },
  );
}
