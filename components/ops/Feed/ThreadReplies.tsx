"use client";

import { useEffect, useState } from "react";

import Avatar from "@/components/ops/ui/Avatar";
import { cn } from "@/lib/ops/cn";
import { isAllowedAttachment } from "@/lib/ops/attachments";
import type { Activity } from "@/types/ops";

import ComposeBox from "./ComposeBox";
import SignedAttachment from "./SignedAttachment";
import {
  ROLE_AVATAR_RING,
  formatRelativeTime,
  type FeedUser,
} from "./types";

type ThreadRepliesProps = {
  parent: Activity;
  replies: Activity[];
  usersById: Map<string, FeedUser>;
  currentUser: FeedUser;
  replyingOpen: boolean;
  onReplyClose: () => void;
};

const COLLAPSE_THRESHOLD = 3;

export default function ThreadReplies({
  parent,
  replies,
  usersById,
  currentUser,
  replyingOpen,
  onReplyClose,
}: ThreadRepliesProps) {
  const [expanded, setExpanded] = useState(replies.length <= COLLAPSE_THRESHOLD);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const hiddenCount =
    !expanded && replies.length > COLLAPSE_THRESHOLD
      ? replies.length - COLLAPSE_THRESHOLD
      : 0;
  const visible = expanded
    ? replies
    : replies.slice(replies.length - COLLAPSE_THRESHOLD);

  return (
    <div className="mt-3 border-l-2 border-zinc-100 pl-3 sm:ml-12 sm:pl-4">
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mb-2 font-mono text-[11px] uppercase tracking-tag text-zinc-500 hover:text-zimx-black"
        >
          Show {hiddenCount} earlier {hiddenCount === 1 ? "reply" : "replies"}
        </button>
      ) : null}

      <ul className="space-y-3">
        {visible.map((reply) => {
          const author = usersById.get(reply.user_id);
          const authorRoleRing = author
            ? ROLE_AVATAR_RING[author.role]
            : "";
          const attachments = (reply.attachments ?? []).filter(isAllowedAttachment);
          return (
            <li key={reply.id} className="flex gap-3">
              <Avatar
                name={author?.name ?? "Unknown"}
                size="sm"
                className={cn("shrink-0", authorRoleRing)}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-medium text-zimx-black">
                    {author?.name ?? "Unknown"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-tag text-zinc-500">
                    {now !== null
                      ? formatRelativeTime(reply.created_at, now)
                      : ""}
                  </span>
                </div>
                {reply.content ? (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zimx-black">
                    {reply.content}
                  </p>
                ) : null}
                {attachments.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {attachments.slice(0, 4).map((path) => (
                      <li
                        key={path}
                        className="h-16 w-16 overflow-hidden border border-zinc-200 bg-zimx-offwhite"
                      >
                        <SignedAttachment
                          path={path}
                          alt="Attachment"
                          className="h-full w-full object-cover"
                          wrapInLink
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {replyingOpen ? (
        <div className="mt-3">
          <ComposeBox
            currentUser={currentUser}
            parentId={parent.id}
            lockedChannel={parent.channel}
            compact
            autoFocus
            placeholder={"Write a reply…"}
            onPosted={onReplyClose}
          />
        </div>
      ) : null}
    </div>
  );
}
