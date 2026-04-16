"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import type { Introduction } from "@/types/ops";

import IntroCard from "./IntroCard";
import IntroFilters from "./IntroFilters";
import NewIntroDialog from "./NewIntroDialog";
import type {
  IntroBusinessOption,
  StatusFilter,
  WarmthFilter,
} from "./types";

type IntrosViewProps = {
  introductions: Introduction[];
  businesses: IntroBusinessOption[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function IntrosView({
  introductions,
  businesses,
  currentUserId,
  isAdmin,
}: IntrosViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [warmthFilter, setWarmthFilter] = useState<WarmthFilter>("all");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    return introductions.filter((i) => {
      if (statusFilter === "pending_approval" && i.roy_approved) return false;
      if (statusFilter === "approved" && !i.roy_approved) return false;
      if (statusFilter === "contacted" && i.status !== "contacted") return false;
      if (statusFilter === "meeting_set" && i.status !== "meeting_set") {
        return false;
      }
      if (warmthFilter !== "all" && i.warmth !== warmthFilter) return false;
      return true;
    });
  }, [introductions, statusFilter, warmthFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <IntroFilters
          status={statusFilter}
          warmth={warmthFilter}
          onStatus={setStatusFilter}
          onWarmth={setWarmthFilter}
        />
        <div className="shrink-0">
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + New intro
          </Button>
        </div>
      </div>

      {introductions.length === 0 ? (
        <EmptyState
          eyebrow="Introductions"
          title="No introductions yet"
          description="Tafadzwa — get networking."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="Introductions"
          title="No intros match these filters"
          description="Loosen the status or warmth filters to see more."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((intro) => (
            <li key={intro.id}>
              <IntroCard
                intro={intro}
                businesses={businesses}
                isAdmin={isAdmin}
              />
            </li>
          ))}
        </ul>
      )}

      <NewIntroDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        businesses={businesses}
        currentUserId={currentUserId}
      />
    </div>
  );
}
