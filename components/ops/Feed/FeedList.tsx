"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import type { Activity } from "@/types/ops";

import FeedItem from "./FeedItem";
import {
  dayBucketLabel,
  type ActivityWithReplies,
  type FeedUser,
} from "./types";

type FeedListProps = {
  roots: ActivityWithReplies[];
  usersById: Map<string, FeedUser>;
  currentUser: FeedUser;
  pageSize: number;
  onConvertToTask: (activity: Activity) => void;
};

export default function FeedList({
  roots,
  usersById,
  currentUser,
  pageSize,
  onConvertToTask,
}: FeedListProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const visibleRoots = roots.slice(0, visibleCount);

  // Group contiguous items by their day bucket so each date label only
  // renders once, matching a chat-app style feed.
  const grouped = useMemo(() => {
    if (now === null) {
      return [{ label: "", items: visibleRoots }];
    }
    const groups: Array<{ label: string; items: ActivityWithReplies[] }> = [];
    for (const item of visibleRoots) {
      const label = dayBucketLabel(item.created_at, now);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(item);
      } else {
        groups.push({ label, items: [item] });
      }
    }
    return groups;
  }, [visibleRoots, now]);

  const hasMore = roots.length > visibleCount;

  return (
    <div className="space-y-5">
      {grouped.map((group, gi) => (
        <section key={`${group.label}-${gi}`} className="space-y-3">
          {group.label ? (
            <h2 className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              {group.label}
            </h2>
          ) : null}
          <ul className="space-y-3">
            {group.items.map((activity) => (
              <li key={activity.id}>
                <FeedItem
                  activity={activity}
                  usersById={usersById}
                  currentUser={currentUser}
                  onConvertToTask={onConvertToTask}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setVisibleCount((n) => n + pageSize)}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
