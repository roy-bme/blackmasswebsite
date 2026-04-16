"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import Card from "@/components/ops/ui/Card";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import Select from "@/components/ops/ui/Select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { IntroStatus, Introduction } from "@/types/ops";

import { INTRO_STATUS_OPTIONS, type IntroBusinessOption } from "./types";

type IntroCardProps = {
  intro: Introduction;
  businesses: IntroBusinessOption[];
  isAdmin: boolean;
};

const WARMTH_TONE: Record<string, PillTone> = {
  cold: "neutral",
  warm: "warning",
  hot: "danger",
};

const STATUS_TONE: Record<IntroStatus, PillTone> = {
  identified: "neutral",
  contacted: "info",
  intro_made: "info",
  roy_approved: "success",
  meeting_set: "warning",
  meeting_done: "success",
  dormant: "neutral",
};

const STATUS_LABEL: Record<IntroStatus, string> = {
  identified: "Identified",
  contacted: "Contacted",
  intro_made: "Intro made",
  roy_approved: "Roy approved",
  meeting_set: "Meeting set",
  meeting_done: "Meeting done",
  dormant: "Dormant",
};

/** Teal override for `intro_made` — the base Pill tone palette doesn't have teal. */
const STATUS_CLASS_OVERRIDE: Partial<Record<IntroStatus, string>> = {
  intro_made: "bg-teal-50 text-teal-700 border-teal-200",
};

const CROSS_BORDER_CLASS = "bg-purple-50 text-purple-700 border-purple-200";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function IntroCard({
  intro,
  businesses,
  isAdmin,
}: IntroCardProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const businessOptions = useMemo(
    () => [{ label: "Select business\u2026", value: "" }, ...businesses.map((b) => ({
      label: b.name,
      value: b.id,
    }))],
    [businesses],
  );

  async function runUpdate(
    actionKey: string,
    patch: Record<string, unknown>,
  ) {
    setPendingAction(actionKey);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("introductions")
      .update(patch)
      .eq("id", intro.id);
    setPendingAction(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function handleApprove() {
    await runUpdate("approve", {
      roy_approved: true,
      status: "roy_approved",
    });
  }

  async function handleStatusChange(next: IntroStatus) {
    if (next === intro.status) return;
    await runUpdate("status", { status: next });
  }

  async function handleBusinessLink(businessId: string) {
    if (!businessId) return;
    await runUpdate("business", { business_id: businessId });
    setLinkOpen(false);
  }

  return (
    <Card padding="none">
      <Card.Body className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-zimx-black">
              {intro.contact_name}
              {intro.role ? (
                <span className="ml-2 font-normal text-zinc-600">
                  &middot; {intro.role}
                </span>
              ) : null}
            </p>
            {intro.business ? (
              <p className="text-[13px] text-zinc-500">{intro.business}</p>
            ) : null}
          </div>
          <Pill
            tone={WARMTH_TONE[intro.warmth] ?? "neutral"}
            size="sm"
          >
            {intro.warmth}
          </Pill>
        </div>

        <div className="space-y-1.5 text-[14px] text-zimx-black">
          {intro.how_connected ? (
            <p>
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                How:
              </span>{" "}
              {intro.how_connected}
            </p>
          ) : null}
          {intro.why_relevant ? (
            <p>
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                Why:
              </span>{" "}
              {intro.why_relevant}
            </p>
          ) : null}
          {intro.recommended_action ? (
            <p>
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                Next:
              </span>{" "}
              {intro.recommended_action}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(intro.pain_points_identified ?? []).map((pp) => (
            <Pill key={pp} tone="info" size="sm">
              {pp}
            </Pill>
          ))}
          {intro.cross_border ? (
            <Pill tone="info" size="sm" className={CROSS_BORDER_CLASS}>
              cross-border
            </Pill>
          ) : null}
          <Pill
            tone={STATUS_TONE[intro.status]}
            size="sm"
            className={STATUS_CLASS_OVERRIDE[intro.status]}
          >
            {STATUS_LABEL[intro.status]}
          </Pill>
          <span className="ml-auto font-mono text-xs text-zinc-400">
            {DATE_FMT.format(new Date(intro.date_created))}
          </span>
        </div>

        {error ? (
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
          >
            {error}
          </p>
        ) : null}

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3">
            {!intro.roy_approved ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={pendingAction === "approve"}
              >
                {pendingAction === "approve"
                  ? "Saving\u2026"
                  : "Approve & contact"}
              </Button>
            ) : null}

            <div className="w-48">
              <Select
                name={`status-${intro.id}`}
                value={intro.status}
                options={INTRO_STATUS_OPTIONS}
                disabled={pendingAction === "status"}
                onChange={(e) =>
                  handleStatusChange(e.target.value as IntroStatus)
                }
                aria-label="Advance status"
              />
            </div>

            {linkOpen ? (
              <div className="w-56">
                <Select
                  name={`link-${intro.id}`}
                  value=""
                  options={businessOptions}
                  disabled={pendingAction === "business"}
                  onChange={(e) => handleBusinessLink(e.target.value)}
                  aria-label="Link to business"
                />
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLinkOpen(true)}
              >
                {intro.business_id ? "Change business" : "Link to business"}
              </Button>
            )}
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
