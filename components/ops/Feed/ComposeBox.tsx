"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Avatar from "@/components/ops/ui/Avatar";
import Button from "@/components/ops/ui/Button";
import { cn } from "@/lib/ops/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActivityChannel } from "@/types/ops";

import { CHANNEL_LABEL, defaultChannelForRole, type FeedUser } from "./types";

type ComposeBoxProps = {
  currentUser: FeedUser;
  /** Optional parent activity id — set when used as the top-of-thread reply form. */
  parentId?: string;
  /** When replying, the channel is inherited from the parent post. */
  lockedChannel?: ActivityChannel;
  placeholder?: string;
  onPosted?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
};

export default function ComposeBox({
  currentUser,
  parentId,
  lockedChannel,
  placeholder,
  onPosted,
  autoFocus,
  compact,
}: ComposeBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<ActivityChannel>(
    lockedChannel ?? defaultChannelForRole(currentUser.role),
  );
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPickChannel =
    !lockedChannel && !parentId && currentUser.role === "admin";

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [autoFocus]);

  // Auto-expand textarea as content grows.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  async function handlePickPhoto(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `feed/${currentUser.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
    setAttachments((prev) => [...prev, pub.publicUrl]);
    setUploading(false);
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a !== url));
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const effectiveChannel = lockedChannel ?? channel;

    const { error: insertError } = await supabase.from("activities").insert({
      user_id: currentUser.id,
      channel: effectiveChannel,
      type: attachments.length > 0 && !trimmed ? "photo" : "daily_report",
      content: trimmed,
      attachments: attachments.length > 0 ? attachments : null,
      parent_id: parentId ?? null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setContent("");
    setAttachments([]);
    onPosted?.();
    router.refresh();
  }

  const isReply = Boolean(parentId);

  return (
    <div
      className={cn(
        "border border-zinc-200 bg-white",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex gap-3">
        <Avatar
          name={currentUser.name}
          size={compact ? "sm" : "md"}
          className="shrink-0"
        />
        <div className="flex-1 space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              placeholder ??
              (isReply ? "Write a reply\u2026" : "Post an update\u2026")
            }
            rows={compact ? 2 : 3}
            className={cn(
              "w-full resize-none border-0 bg-transparent p-0 text-[14px] text-zimx-black outline-none placeholder:text-zinc-400 focus:outline-none focus:ring-0",
              compact ? "min-h-[56px]" : "min-h-[80px]",
            )}
            disabled={submitting}
          />

          {attachments.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {attachments.map((url) => (
                <li
                  key={url}
                  className="relative h-20 w-20 overflow-hidden border border-zinc-200 bg-zimx-offwhite"
                >
                  <img
                    src={url}
                    alt="Attachment preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(url)}
                    aria-label="Remove attachment"
                    className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center bg-zimx-black/80 font-mono text-[12px] leading-none text-white hover:bg-zimx-red"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {canPickChannel ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="compose-channel"
                className="font-mono text-[11px] uppercase tracking-tag text-zinc-500"
              >
                Post to
              </label>
              <select
                id="compose-channel"
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as ActivityChannel)
                }
                className="border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] uppercase tracking-tag text-zimx-black outline-none focus:border-zimx-black"
              >
                <option value="ground_ops">
                  {CHANNEL_LABEL.ground_ops}
                </option>
                <option value="bd_networking">
                  {CHANNEL_LABEL.bd_networking}
                </option>
              </select>
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex shrink-0">
              <span className="sr-only">Attach photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickPhoto}
                disabled={uploading || submitting}
              />
              <span
                className={cn(
                  "inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
                  (uploading || submitting) &&
                    "pointer-events-none opacity-50",
                )}
                title="Attach photo"
              >
                <PaperclipIcon />
              </span>
            </label>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={
                submitting ||
                uploading ||
                (content.trim().length === 0 && attachments.length === 0)
              }
            >
              {submitting
                ? "Posting\u2026"
                : uploading
                  ? "Uploading\u2026"
                  : isReply
                    ? "Reply"
                    : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.5 5.5l-6 6a2.5 2.5 0 003.5 3.5l7-7a4 4 0 00-5.7-5.7l-7 7a5.5 5.5 0 007.8 7.8l6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
