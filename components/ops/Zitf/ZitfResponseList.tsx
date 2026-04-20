"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ops/ui/Button";
import EmptyState from "@/components/ops/ui/EmptyState";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import Select from "@/components/ops/ui/Select";
import { cn } from "@/lib/ops/cn";
import type { UserRole } from "@/types/ops";
import {
  ZITF_CHANNEL_LABEL,
  ZITF_SPEND_BANDS,
  ZITF_SPEND_BAND_LABEL,
  ZITF_STATUS_LABEL,
  canUpdateZitfRow,
  type ZitfChannel,
  type ZitfResponse,
  type ZitfStatus,
} from "@/types/zitf";

import ZitfResponseDetailDialog from "./ZitfResponseDetailDialog";
import { responsesToCsv, triggerCsvDownload } from "./csv";

type ZitfResponseListProps = {
  rows: ZitfResponse[];
  currentUserRole: UserRole;
};

type SortKey = "submitted_at" | "qualified_score" | "status" | "spend";
type SortDir = "asc" | "desc";

type FilterState = {
  status: ZitfStatus | "";
  channel: ZitfChannel | "";
  priorityOnly: boolean;
};

const EMPTY_FILTERS: FilterState = {
  status: "",
  channel: "",
  priorityOnly: false,
};

const STATUS_TONE: Record<ZitfStatus, PillTone> = {
  new: "info",
  qualified: "success",
  contacted: "ink",
  pilot_candidate: "warning",
  rejected: "danger",
};

const CHANNEL_TONE: Record<ZitfChannel, PillTone> = {
  digital: "info",
  paper: "warning",
  import: "neutral",
};

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function spendRank(band: ZitfResponse["monthly_supplier_spend_band"]): number {
  if (!band) return -1;
  return ZITF_SPEND_BANDS.indexOf(band);
}

export default function ZitfResponseList({
  rows,
  currentUserRole,
}: ZitfResponseListProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openId, setOpenId] = useState<string | null>(null);

  const canEdit = canUpdateZitfRow(currentUserRole);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filters.status && row.status !== filters.status) return false;
      if (filters.channel && row.channel !== filters.channel) return false;
      if (filters.priorityOnly && !row.is_priority_followup) return false;
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => {
    const dirMult = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "submitted_at":
          return a.submitted_at.localeCompare(b.submitted_at) * dirMult;
        case "qualified_score":
          return (a.qualified_score - b.qualified_score) * dirMult;
        case "status":
          return a.status.localeCompare(b.status) * dirMult;
        case "spend":
          return (spendRank(a.monthly_supplier_spend_band) -
            spendRank(b.monthly_supplier_spend_band)) * dirMult;
      }
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "submitted_at" || key === "qualified_score" ? "desc" : "asc");
    }
  }

  function handleExport() {
    const csv = responsesToCsv(sorted);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(csv, `zitf-responses-${stamp}.csv`);
  }

  const activeRow = openId ? rows.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as ZitfStatus | "",
              }))
            }
            containerClassName="min-w-[140px]"
          >
            <option value="">All</option>
            {(Object.keys(ZITF_STATUS_LABEL) as ZitfStatus[]).map((s) => (
              <option key={s} value={s}>
                {ZITF_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Select
            label="Channel"
            value={filters.channel}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                channel: e.target.value as ZitfChannel | "",
              }))
            }
            containerClassName="min-w-[140px]"
          >
            <option value="">All</option>
            {(Object.keys(ZITF_CHANNEL_LABEL) as ZitfChannel[]).map((c) => (
              <option key={c} value={c}>
                {ZITF_CHANNEL_LABEL[c]}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-tag text-zimx-black md:pb-2.5">
            <input
              type="checkbox"
              checked={filters.priorityOnly}
              onChange={(e) =>
                setFilters((f) => ({ ...f, priorityOnly: e.target.checked }))
              }
              className="h-4 w-4 border border-zinc-300 accent-zimx-green"
            />
            Priority only
          </label>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          eyebrow="ZITF responses"
          title="No responses match these filters"
          description="Clear the filters above or wait for new submissions."
        />
      ) : (
        <div className="overflow-x-auto border border-zinc-200 bg-white">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="bg-zimx-offwhite font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              <tr>
                <SortHeader
                  label="Submitted"
                  active={sortKey === "submitted_at"}
                  dir={sortDir}
                  onClick={() => toggleSort("submitted_at")}
                />
                <th className="px-3 py-3 text-left">Business</th>
                <SortHeader
                  label="Score"
                  active={sortKey === "qualified_score"}
                  dir={sortDir}
                  onClick={() => toggleSort("qualified_score")}
                  align="right"
                />
                <SortHeader
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
                <th className="px-3 py-3 text-left">Channel</th>
                <SortHeader
                  label="Spend"
                  active={sortKey === "spend"}
                  dir={sortDir}
                  onClick={() => toggleSort("spend")}
                />
                <th className="px-3 py-3 text-left">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {sorted.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setOpenId(row.id)}
                  className="cursor-pointer hover:bg-zimx-offwhite"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-500">
                    {DATE_FMT.format(new Date(row.submitted_at))}
                  </td>
                  <td className="px-3 py-3 text-zimx-black">
                    <p className="font-medium">
                      {row.business_name ?? "—"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {row.contact_name ?? "No contact name"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] text-zimx-black">
                    {Math.round(row.qualified_score)}
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={STATUS_TONE[row.status]} size="sm">
                      {ZITF_STATUS_LABEL[row.status]}
                    </Pill>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={CHANNEL_TONE[row.channel]} size="sm">
                      {ZITF_CHANNEL_LABEL[row.channel]}
                    </Pill>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-500">
                    {row.monthly_supplier_spend_band
                      ? ZITF_SPEND_BAND_LABEL[row.monthly_supplier_spend_band]
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row.is_priority_followup ? (
                      <Pill tone="success" size="sm">
                        Priority
                      </Pill>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ZitfResponseDetailDialog
        row={activeRow}
        canEdit={canEdit}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

type SortHeaderProps = {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
};

function SortHeader({ label, active, dir, onClick, align = "left" }: SortHeaderProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-3",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-tag",
          active ? "text-zimx-black" : "text-zinc-500 hover:text-zimx-black",
        )}
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}
