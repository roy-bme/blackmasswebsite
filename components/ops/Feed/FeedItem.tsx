"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import Avatar from "@/components/ops/ui/Avatar";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import type { Activity } from "@/types/ops";

import ThreadReplies from "./ThreadReplies";
import {
  CHANNEL_LABEL,
  CHANNEL_PILL_CLASS,
  ROLE_AVATAR_RING,
  formatRelativeTime,
  type ActivityWithReplies,
  type FeedUser,
} from "./types";

type FeedItemProps = {
  activity: ActivityWithReplies;
  usersById: Map<string, FeedUser>;
  currentUser: FeedUser;
  onConvertToTask: (activity: Activity) => void;
};

export default function FeedItem({
  activity,
  usersById,
  currentUser,
  onConvertToTask,
}: FeedItemProps) {
  const author = usersById.get(activity.user_id);
  const [replying, setReplying] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  // Resolve timestamps on the client only to avoid SSR/CSR mismatches.
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const channelLabel = CHANNEL_LABEL[activity.channel];
  const channelClass = CHANNEL_PILL_CLASS[activity.channel];
  const attachments = activity.attachments ?? [];
  const authorRoleRing = author ? ROLE_AVATAR_RING[author.role] : "";

  return (
    <article className="border border-zinc-200 bg-white p-4">
      <div className="flex gap-3">
        <Avatar
          name={author?.name ?? "Unknown"}
          size="md"
          className={cn("shrink-0", authorRoleRing)}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-[14px] text-zimx-black">
              {author?.name ?? "Unknown"}
            </span>
            <Pill size="sm" className={channelClass}>
              {channelLabel}
            </Pill>
            <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              {now !== null ? formatRelativeTime(activity.created_at, now) : ""}
            </span>
          </header>

          {activity.content ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zimx-black">
              {activity.content}
            </p>
          ) : null}

          {attachments.length > 0 ? (
            <ul
              className={cn(
                "grid gap-2",
                attachments.length === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {attachments.slice(0, 4).map((url) => (
                <li
                  key={url}
                  className="overflow-hidden border border-zinc-200 bg-zimx-offwhite"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[4/3]"
                  >
                    <img
                      src={url}
                      alt="Attachment"
                      className="h-full w-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <button
              type="button"
              onClick={() => setReplying((prev) => !prev)}
              className="font-mono text-[11px] uppercase tracking-tag text-zinc-400 hover:text-zimx-black"
            >
              {replying ? "Cancel" : "Reply"}
            </button>
            {currentUser.role === "admin" ? (
              <button
                type="button"
                onClick={() => onConvertToTask(activity)}
                className="font-mono text-[11px] uppercase tracking-tag text-zinc-400 hover:text-zimx-black"
              >
                Convert to task
              </button>
            ) : null}
            {activity.replies.length > 0 ? (
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-400">
                {activity.replies.length}{" "}
                {activity.replies.length === 1 ? "reply" : "replies"}
              </span>
            ) : null}
          </footer>
        </div>
      </div>

      {activity.replies.length > 0 || replying ? (
        <ThreadReplies
          parent={activity}
          replies={activity.replies}
          usersById={usersById}
          currentUser={currentUser}
          replyingOpen={replying}
          onReplyClose={() => setReplying(false)}
        />
      ) : null}
    </article>
  );
}
