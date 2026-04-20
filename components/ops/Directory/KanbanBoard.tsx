"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/ops/ui/EmptyState";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import { getSectorTheme } from "@/lib/ops/sector-colors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import DraggableCard from "./DraggableCard";
import {
  KANBAN_COLUMNS,
  columnForStage,
  type DirectoryBusiness,
  type KanbanColumnKey,
} from "./types";

type KanbanBoardProps = {
  businesses: DirectoryBusiness[];
  canEdit: boolean;
  onOpen: (id: string) => void;
};

export default function KanbanBoard({
  businesses,
  canEdit,
  onOpen,
}: KanbanBoardProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<Record<string, KanbanColumnKey>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  // Clear optimistic entries once the server has confirmed the new stage. Any
  // id whose server-side stage now matches the optimistic column can be
  // dropped from the overlay so stale entries don't linger across refetches.
  useEffect(() => {
    setOptimistic((prev) => {
      let changed = false;
      const next: Record<string, KanbanColumnKey> = {};
      for (const [id, column] of Object.entries(prev)) {
        const b = businesses.find((x) => x.id === id);
        if (!b) {
          next[id] = column;
          continue;
        }
        if (columnForStage(b.onboarding_stage) === column) {
          changed = true;
          continue;
        }
        next[id] = column;
      }
      return changed ? next : prev;
    });
  }, [businesses]);

  // Both sensors use a delay-based activation so that cards accept clicks
  // instantly but only enter a drag after a deliberate hold — on mobile this
  // lets the page keep scrolling when the user merely swipes over a card.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const grouped = useMemo(() => {
    const map: Record<KanbanColumnKey, DirectoryBusiness[]> = {
      identified: [],
      intel_gathered: [],
      meeting_set: [],
      onboarded: [],
    };
    for (const b of businesses) {
      const col = optimistic[b.id] ?? columnForStage(b.onboarding_stage);
      map[col].push(b);
    }
    for (const key of Object.keys(map) as KanbanColumnKey[]) {
      map[key].sort((a, b) => {
        if (a.launch_6 !== b.launch_6) return a.launch_6 ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [businesses, optimistic]);

  async function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over) return;

    const businessId = String(active.id);
    const targetColumn = String(over.id) as KanbanColumnKey;
    const column = KANBAN_COLUMNS.find((c) => c.key === targetColumn);
    if (!column) return;

    const business = businesses.find((b) => b.id === businessId);
    if (!business) return;

    const currentColumn =
      optimistic[businessId] ?? columnForStage(business.onboarding_stage);
    if (currentColumn === targetColumn) return;

    setOptimistic((prev) => ({ ...prev, [businessId]: targetColumn }));
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: updateError } = await supabase
        .from("businesses")
        .update({ onboarding_stage: column.defaultStage })
        .eq("id", businessId)
        .select("id, onboarding_stage");

      if (updateError) throw new Error(updateError.message);
      // .select() returns [] when RLS filters the row out even though the
      // update technically "succeeded" — treat that as an auth failure.
      if (!data || data.length === 0) {
        throw new Error(
          "Stage update was not persisted. Check your permissions.",
        );
      }

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update stage.";
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[businessId];
        return next;
      });
      setError(message);
    }
  }

  const totalCount = businesses.length;

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}
      {totalCount === 0 ? (
        <EmptyState
          eyebrow="Directory"
          title="No businesses match"
          description="Clear the filters or broaden the search to see more results."
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="grid min-w-[900px] grid-cols-4 gap-3 md:min-w-0">
              {KANBAN_COLUMNS.map((col) => (
                <Column
                  key={col.key}
                  columnKey={col.key}
                  label={col.label}
                  count={grouped[col.key].length}
                  businesses={grouped[col.key]}
                  canEdit={canEdit}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
}

type ColumnProps = {
  columnKey: KanbanColumnKey;
  label: string;
  count: number;
  businesses: DirectoryBusiness[];
  canEdit: boolean;
  onOpen: (id: string) => void;
};

function Column({
  columnKey,
  label,
  count,
  businesses,
  canEdit,
  onOpen,
}: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col border border-zinc-200 bg-zimx-offwhite transition-colors",
        isOver && canEdit && "border-zimx-black bg-zinc-100",
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-tag text-zimx-black">
          {label}
        </span>
        <span className="font-mono text-[11px] tracking-tag text-zinc-500">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {businesses.map((b) => (
          <DraggableCard key={b.id} id={b.id} disabled={!canEdit}>
            <KanbanCard business={b} onOpen={onOpen} />
          </DraggableCard>
        ))}
      </div>
    </div>
  );
}

type KanbanCardProps = {
  business: DirectoryBusiness;
  onOpen: (id: string) => void;
};

function KanbanCard({ business, onOpen }: KanbanCardProps) {
  const sectorTheme = getSectorTheme(business.sector);
  return (
    <div
      className="border border-zinc-200 bg-white p-3 shadow-sm"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(business.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(business.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-tight text-zimx-black">
          {business.name}
        </p>
        {business.launch_6 ? (
          <span
            className="shrink-0 text-[14px] leading-none text-zimx-gold"
            aria-label="Launch 6"
            title="Launch 6"
          >
            {"\u2605"}
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        <Pill sector={sectorTheme.key} size="sm">
          {sectorTheme.label}
        </Pill>
      </div>
    </div>
  );
}
