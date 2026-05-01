"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";
import type { AgentSuggestion, BusinessStage } from "@/types/ops";

const STAGE_ORDER: BusinessStage[] = [
  "identified",
  "intel_gathered",
  "intro_made",
  "meeting_set",
  "meeting_done",
  "loi_signed",
  "onboarded",
];

type SuggestionsListProps = {
  suggestions: AgentSuggestion[];
};

export default function SuggestionsList({ suggestions }: SuggestionsListProps) {
  const router = useRouter();
  const toast = useToast();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visible = useMemo(
    () => suggestions.filter((s) => !dismissed.has(s.id)),
    [suggestions, dismissed],
  );

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function handleAccept(s: AgentSuggestion) {
    if (!s.target_id) {
      dismiss(s.id);
      toast.info("Suggestion accepted.");
      return;
    }
    const currentStage = (s.payload?.current_stage as BusinessStage | undefined) ?? null;
    let nextStage: BusinessStage | null = null;
    if (currentStage) {
      const idx = STAGE_ORDER.indexOf(currentStage);
      if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
        nextStage = STAGE_ORDER[idx + 1] ?? null;
      }
    } else {
      nextStage = "intel_gathered";
    }
    if (!nextStage) {
      dismiss(s.id);
      toast.info("Suggestion accepted.");
      return;
    }
    setPendingId(s.id);
    const res = await opsApiPost("/api/ops/businesses/update", {
      id: s.target_id,
      patch: { onboarding_stage: nextStage },
    });
    setPendingId(null);
    if (!res.ok) {
      toast.error("Could not accept suggestion. Try again.");
      return;
    }
    dismiss(s.id);
    toast.success(`Advanced to ${nextStage.replace(/_/g, " ")}.`);
    router.refresh();
  }

  function handleSkip(s: AgentSuggestion) {
    dismiss(s.id);
    toast.info("Suggestion skipped.");
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No open suggestions."
        description="The agent will surface actionable items here."
      />
    );
  }

  return (
    <div className="divide-y divide-line-10">
      {visible.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 py-3"
        >
          <div>
            <div className="text-[13px] font-medium text-white">
              {(s.payload?.title as string) ?? s.kind}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              {(s.payload?.subtitle as string) ?? s.kind}
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAccept(s)}
              disabled={pendingId === s.id}
            >
              {pendingId === s.id ? "…" : "Accept"}
            </Button>
            <Button
              variant="bare"
              size="sm"
              onClick={() => handleSkip(s)}
              disabled={pendingId === s.id}
            >
              Skip
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
