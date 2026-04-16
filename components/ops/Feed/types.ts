import type { Activity, ActivityChannel, UserRole } from "@/types/ops";

export type FeedUser = {
  id: string;
  name: string;
  role: UserRole;
};

/** Admin-only channel filter: "all" adds to the three concrete channels. */
export type ChannelFilter = ActivityChannel | "all";

export const CHANNEL_LABEL: Record<ActivityChannel, string> = {
  ground_ops: "Ground ops",
  bd_networking: "BD & networking",
  admin: "Admin",
};

/**
 * Tailwind utility bundle for each channel pill. Kept as concrete strings
 * (not template-interpolated) so Tailwind's JIT picks them up.
 */
export const CHANNEL_PILL_CLASS: Record<ActivityChannel, string> = {
  ground_ops: "bg-blue-50 text-blue-700 border-blue-200",
  bd_networking: "bg-orange-50 text-orange-700 border-orange-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

/**
 * Role-tinted avatar classes. Admin = purple, ops = blue, bd = coral/orange.
 * Applied as a border + subtle ring so the underlying Avatar initials keep
 * their sector-palette background.
 */
export const ROLE_AVATAR_RING: Record<UserRole, string> = {
  admin: "ring-2 ring-purple-400/60",
  ops: "ring-2 ring-blue-400/60",
  bd: "ring-2 ring-orange-400/60",
};

export type ActivityWithReplies = Activity & {
  replies: Activity[];
};

/**
 * Group a flat list of activities into top-level posts + their replies.
 * Top-level = `parent_id === null`. Replies keep their original order
 * (oldest → newest) so threaded conversations read top-to-bottom.
 */
export function groupActivitiesWithReplies(
  activities: Activity[],
): ActivityWithReplies[] {
  const byParent = new Map<string, Activity[]>();
  const roots: Activity[] = [];

  for (const a of activities) {
    if (a.parent_id) {
      const list = byParent.get(a.parent_id) ?? [];
      list.push(a);
      byParent.set(a.parent_id, list);
    } else {
      roots.push(a);
    }
  }

  for (const list of byParent.values()) {
    list.sort((x, y) => x.created_at.localeCompare(y.created_at));
  }

  return roots.map((r) => ({ ...r, replies: byParent.get(r.id) ?? [] }));
}

/**
 * Human-friendly relative time: "just now" / "5m ago" / "2h ago" /
 * "yesterday" / "12 Mar" / "12 Mar 2024" for older dates.
 *
 * Pure function of the two timestamps so it's safe for server rendering;
 * clients pass `Date.now()` on render.
 */
export function formatRelativeTime(
  isoDateTime: string,
  nowMs: number,
): string {
  const then = new Date(isoDateTime).getTime();
  const diffSec = Math.max(0, Math.round((nowMs - then) / 1000));

  if (diffSec < 45) return "just now";
  if (diffSec < 60 * 60) {
    const m = Math.max(1, Math.round(diffSec / 60));
    return `${m}m ago`;
  }
  if (diffSec < 60 * 60 * 24) {
    const h = Math.max(1, Math.round(diffSec / 3600));
    return `${h}h ago`;
  }

  const thenDate = new Date(isoDateTime);
  const now = new Date(nowMs);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfThen = new Date(
    thenDate.getFullYear(),
    thenDate.getMonth(),
    thenDate.getDate(),
  ).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;

  const sameYear = thenDate.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(thenDate);
}

/**
 * Day-bucket label used by FeedList to insert Today / Yesterday / date
 * headers between groups.
 */
export function dayBucketLabel(isoDateTime: string, nowMs: number): string {
  const then = new Date(isoDateTime);
  const now = new Date(nowMs);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfThen = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate(),
  ).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  const sameYear = then.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(then);
}

/**
 * Default channel for a user's own posts based on their role.
 *   ops → ground_ops, bd → bd_networking, admin → ground_ops (overridable).
 */
export function defaultChannelForRole(role: UserRole): ActivityChannel {
  if (role === "bd") return "bd_networking";
  return "ground_ops";
}
