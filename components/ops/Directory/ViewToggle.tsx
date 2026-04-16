"use client";

import { cn } from "@/lib/ops/cn";

export type DirectoryViewMode = "list" | "kanban";

type ViewToggleProps = {
  mode: DirectoryViewMode;
  onChange: (mode: DirectoryViewMode) => void;
};

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex self-start border border-zinc-200 bg-white"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        aria-label="List view"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-tag transition-colors",
          mode === "list"
            ? "bg-zimx-black text-white"
            : "text-zinc-500 hover:text-zimx-black",
        )}
      >
        <ListIcon />
        <span>List</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        aria-pressed={mode === "kanban"}
        aria-label="Kanban view"
        className={cn(
          "inline-flex items-center gap-1.5 border-l border-zinc-200 px-3 py-2 font-mono text-[11px] uppercase tracking-tag transition-colors",
          mode === "kanban"
            ? "bg-zimx-black text-white"
            : "text-zinc-500 hover:text-zimx-black",
        )}
      >
        <KanbanIcon />
        <span>Kanban</span>
      </button>
    </div>
  );
}

function ListIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 2h10M1 6h10M1 10h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="3"
        height="10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="5"
        y="1"
        width="3"
        height="6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="1"
        width="2"
        height="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
