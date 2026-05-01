import Avatar from "@/components/ops/ui/Avatar";
import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Pill from "@/components/ops/ui/Pill";
import PageHeader from "@/components/ops/PageHeader";
import FeedComposer from "@/components/ops/Feed/FeedComposer";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Activity,
  FeedChannel,
  User,
  UserRole,
} from "@/types/ops";

export const dynamic = "force-dynamic";

const FEED_PAGE_SIZE = 50;

function channelsForRole(role: UserRole): FeedChannel[] | null {
  if (role === "admin") return null;
  if (role === "ops") return ["ground_ops"];
  if (role === "bd") return ["bd_networking"];
  return ["compliance"];
}

const CHANNEL_LABEL: Record<FeedChannel, string> = {
  admin: "admin",
  ground_ops: "ground_ops",
  bd_networking: "bd_networking",
  compliance: "compliance",
};

const DEFAULT_CHANNEL: Record<UserRole, FeedChannel> = {
  admin: "admin",
  ops: "ground_ops",
  bd: "bd_networking",
  compliance: "compliance",
};

export default async function FeedPage() {
  const user = await requireModuleAccess("/indaba/feed");
  const supabase = createSupabaseServerClient();

  const visibleChannels = channelsForRole(user.role);

  let q = supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (visibleChannels !== null) q = q.in("channel", visibleChannels);

  const [actsRes, usersRes] = await Promise.all([
    q,
    supabase.from("users").select("id, name, role"),
  ]);

  const acts = (actsRes.data ?? []) as Activity[];
  const users = (usersRes.data ?? []) as Pick<User, "id" | "name" | "role">[];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const myChannel = DEFAULT_CHANNEL[user.role];

  return (
    <div>
      <PageHeader
        eyebrow={`indaba · feed · ${myChannel}`}
        title="feed"
        caption={`${acts.length} recent · ${user.name}`}
      />

      <div className="space-y-2 px-4 py-4 md:px-6 md:py-5">
        <FeedComposer channel={myChannel} variant="inline" />

        {acts.length === 0 ? (
          <EmptyState
            title="No posts yet."
            description="Post a daily report or attach a visit photo to start the feed."
          />
        ) : null}

        {acts.map((p) => {
          const author = userMap.get(p.user_id);
          const isAgent =
            author?.name?.toLowerCase().includes("agent") ?? false;
          const isRoy = author?.role === "admin";
          return (
            <Card key={p.id} padding="md">
              <div className="flex gap-3">
                <Avatar
                  name={author?.name ?? "Unknown"}
                  size="md"
                  gold={isRoy || isAgent}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-white">
                      {author?.name ?? "Unknown"}
                    </span>
                    <span className="font-mono text-[10px] text-fg-dim">
                      {timeAgo(p.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Pill tone="gold" size="sm">
                      {CHANNEL_LABEL[p.channel as FeedChannel] ?? p.channel}
                    </Pill>
                    <Pill size="sm">{p.type.replace(/_/g, " ")}</Pill>
                  </div>
                  <p className={`mt-2 whitespace-pre-line text-[13px] leading-relaxed ${isAgent ? "font-mono text-fg-mute" : "text-white"}`}>
                    {p.content}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <FeedComposer channel={myChannel} variant="sticky" />
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
