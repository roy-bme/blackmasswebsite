import FeedView from "@/components/ops/Feed/FeedView";
import type { FeedUser } from "@/components/ops/Feed/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Activity, ActivityChannel, User, UserRole } from "@/types/ops";

const FEED_PAGE_SIZE = 50;

function channelsForRole(role: UserRole): ActivityChannel[] | null {
  if (role === "admin") return null;
  if (role === "ops") return ["ground_ops"];
  if (role === "bd") return ["bd_networking"];
  return [];
}

export default async function FeedPage() {
  const user = await requireModuleAccess("/indaba/feed");
  const supabase = createSupabaseServerClient();

  const visibleChannels = channelsForRole(user.role);

  // Pull enough rows for recent top-level posts plus their replies. Threads
  // are resolved client-side so we over-fetch a bit here to keep the query
  // simple.
  let activitiesQuery = supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE * 4);

  if (visibleChannels !== null) {
    activitiesQuery = activitiesQuery.in("channel", visibleChannels);
  }

  const [activitiesRes, usersRes] = await Promise.all([
    activitiesQuery,
    supabase.from("users").select("id, name, role"),
  ]);

  const activities = (activitiesRes.data ?? []) as Activity[];
  const users: FeedUser[] = (
    (usersRes.data ?? []) as Pick<User, "id" | "name" | "role">[]
  ).map((u) => ({ id: u.id, name: u.name, role: u.role }));

  return (
    <FeedView
      activities={activities}
      users={users}
      currentUser={user}
      pageSize={FEED_PAGE_SIZE}
    />
  );
}
