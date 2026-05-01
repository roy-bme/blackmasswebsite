"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ops/ui/Button";
import Pill from "@/components/ops/ui/Pill";
import Textarea from "@/components/ops/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";
import type { FeedChannel } from "@/types/ops";

type FeedComposerProps = {
  channel: FeedChannel;
  variant?: "inline" | "sticky";
};

export default function FeedComposer({ channel, variant = "inline" }: FeedComposerProps) {
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function handlePost() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setPosting(true);
    const res = await opsApiPost("/api/ops/activities/create", {
      channel,
      type: "comment",
      content: trimmed,
    });
    setPosting(false);
    if (!res.ok) {
      toast.error("Could not post. Try again.");
      return;
    }
    setContent("");
    toast.success("Posted to feed.");
    router.refresh();
  }

  if (variant === "sticky") {
    return (
      <div
        className="md:hidden fixed inset-x-0 bottom-[60px] z-20 flex items-end gap-2 border-t border-line-15 bg-ink-700/95 px-3 py-2.5 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        <Pill tone="gold" size="sm">
          {channel}
        </Pill>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={1}
          placeholder="Post to feed…"
          className="min-h-[40px] flex-1 resize-none"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handlePost}
          disabled={posting || !content.trim()}
        >
          {posting ? "…" : "Post"}
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden md:block sticky bottom-0 z-10 -mx-4 mt-4 border-t border-line-15 bg-ink-700/95 px-4 py-3 backdrop-blur md:mx-0 md:px-6">
      <div className="flex items-end gap-2">
        <Pill tone="gold" size="sm">
          {channel}
        </Pill>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Post to feed…"
          className="flex-1"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handlePost}
          disabled={posting || !content.trim()}
        >
          {posting ? "Posting…" : "Post"}
        </Button>
      </div>
    </div>
  );
}
