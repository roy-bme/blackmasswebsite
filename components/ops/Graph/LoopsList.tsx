"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Loop } from "@/types/ops";

import type { GraphBusiness } from "./types";

type LoopsListProps = {
  businesses: GraphBusiness[];
  loops: Loop[];
  isAdmin: boolean;
};

const STATUS_TONES: Record<string, PillTone> = {
  detected: "warning",
  validated: "success",
  target: "warning",
};

/** Target status uses a filled gold pill so it stands apart from "detected". */
const TARGET_OVERRIDE_CLASS =
  "bg-zimx-gold text-zimx-black border-zimx-gold";

function formatVolume(value: number | null | undefined): string {
  if (value == null) return "Volume n/a";
  return `$${Number(value).toLocaleString()}`;
}

export default function LoopsList({
  businesses,
  loops,
  isAdmin,
}: LoopsListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of businesses) m.set(b.id, b.name);
    return m;
  }, [businesses]);

  async function handleMarkTarget(id: string) {
    setPendingId(id);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("loops")
      .update({ status: "target" })
      .eq("id", id);
    setPendingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  if (loops.length === 0) {
    return (
      <EmptyState
        eyebrow="Loops"
        title="No loops detected yet"
        description="Log supply chain links between businesses, then hit &ldquo;Detect loops&rdquo;."
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {loops.map((loop) => {
          const ids = loop.business_ids ?? [];
          const resolved = ids
            .map((id) => nameById.get(id) ?? "Unknown")
            .join(" \u2192 ");
          const tone = STATUS_TONES[loop.status] ?? "neutral";
          const canMarkTarget = isAdmin && loop.status !== "target";
          return (
            <li
              key={loop.id}
              className="border border-l-4 border-zinc-200 border-l-amber-400 bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                    {loop.name}
                  </p>
                  <p className="mt-1 text-[14px] text-zimx-black">
                    {resolved || "No businesses on this loop"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                    {formatVolume(loop.total_estimated_volume)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Pill
                    tone={tone}
                    size="sm"
                    className={cn(
                      loop.status === "target" && TARGET_OVERRIDE_CLASS,
                    )}
                  >
                    {loop.status}
                  </Pill>
                  {canMarkTarget ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMarkTarget(loop.id)}
                      disabled={pendingId === loop.id}
                    >
                      {pendingId === loop.id
                        ? "Saving\u2026"
                        : "Mark as target"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
