"use client";

import { useMemo, useState } from "react";

import EmptyState from "@/components/ops/ui/EmptyState";
import type { Activity } from "@/types/ops";

import ComposeBox from "./ComposeBox";
import ConvertToTaskDialog from "./ConvertToTaskDialog";
import FeedFilters from "./FeedFilters";
import FeedList from "./FeedList";
import {
  groupActivitiesWithReplies,
  type ChannelFilter,
  type FeedUser,
} from "./types";

type FeedViewProps = {
  activities: Activity[];
  users: FeedUser[];
  currentUser: FeedUser;
  pageSize: number;
};

export default function FeedView({
  activities,
  users,
  currentUser,
  pageSize,
}: FeedViewProps) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [convertActivity, setConvertActivity] = useState<Activity | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, FeedUser>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const filteredRoots = useMemo(() => {
    const grouped = groupActivitiesWithReplies(activities);
    if (currentUser.role !== "admin" || channelFilter === "all") return grouped;
    return grouped.filter((a) => a.channel === channelFilter);
  }, [activities, channelFilter, currentUser.role]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-mono text-[13px] uppercase tracking-tag text-zinc-500">
          Ops feed
        </h1>
      </div>

      {currentUser.role === "admin" ? (
        <FeedFilters value={channelFilter} onChange={setChannelFilter} />
      ) : null}

      <ComposeBox currentUser={currentUser} />

      {filteredRoots.length === 0 ? (
        <EmptyState
          eyebrow="Feed"
          title="No activity yet"
          description="Post your first daily update."
        />
      ) : (
        <FeedList
          roots={filteredRoots}
          usersById={usersById}
          currentUser={currentUser}
          pageSize={pageSize}
          onConvertToTask={(activity) => setConvertActivity(activity)}
        />
      )}

      <ConvertToTaskDialog
        activity={convertActivity}
        users={users}
        currentUserId={currentUser.id}
        onClose={() => setConvertActivity(null)}
      />
    </div>
  );
}
