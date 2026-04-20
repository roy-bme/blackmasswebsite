"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { UserRole } from "@/types/ops";

import BusinessDetailDialog from "./BusinessDetailDialog";
import BusinessList from "./BusinessList";
import DirectoryFilters, {
  EMPTY_FILTERS,
  type DirectoryFilterState,
} from "./DirectoryFilters";
import KanbanBoard from "./KanbanBoard";
import ViewToggle, { type DirectoryViewMode } from "./ViewToggle";
import type { DirectoryBusiness, DirectoryZone } from "./types";

type DirectoryViewProps = {
  businesses: DirectoryBusiness[];
  zones: DirectoryZone[];
  currentUserId: string;
  currentUserRole: UserRole;
  canEdit: boolean;
  canSeeContacts: boolean;
  initialOpenId: string | null;
};

const DESKTOP_BREAKPOINT = 768;

function initialViewMode(): DirectoryViewMode {
  if (typeof window === "undefined") return "list";
  return window.innerWidth >= DESKTOP_BREAKPOINT ? "kanban" : "list";
}

export default function DirectoryView({
  businesses,
  zones,
  currentUserId,
  currentUserRole,
  canEdit,
  canSeeContacts,
  initialOpenId,
}: DirectoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<DirectoryFilterState>(EMPTY_FILTERS);

  const [mode, setMode] = useState<DirectoryViewMode>(initialViewMode);
  const [modeOverridden, setModeOverridden] = useState(false);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

  const patchFilters = useCallback(
    (patch: Partial<DirectoryFilterState>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  // Track the initial id so we only auto-open once per incoming URL change.
  useEffect(() => {
    setOpenId(initialOpenId);
  }, [initialOpenId]);

  // Follow viewport size until the user manually picks a view.
  useEffect(() => {
    if (modeOverridden) return;
    const handler = () => {
      setMode(
        window.innerWidth >= DESKTOP_BREAKPOINT ? "kanban" : "list",
      );
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [modeOverridden]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (filters.sector && b.sector !== filters.sector) return false;
      if (filters.zoneId && b.zone_id !== filters.zoneId) return false;
      if (filters.launch6 && !b.launch_6) return false;
      if (query && !b.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [businesses, filters]);

  const activeBusiness = useMemo(
    () => (openId ? businesses.find((b) => b.id === openId) ?? null : null),
    [businesses, openId],
  );

  function handleOpenDetail(id: string) {
    setOpenId(id);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("id", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleCloseDetail() {
    setOpenId(null);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("id");
    const queryString = params.toString();
    router.replace(
      queryString ? `${pathname}?${queryString}` : pathname,
      { scroll: false },
    );
  }

  function handleModeChange(next: DirectoryViewMode) {
    setMode(next);
    setModeOverridden(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <DirectoryFilters
          filters={filters}
          zones={zones}
          onChange={patchFilters}
        />
        <ViewToggle mode={mode} onChange={handleModeChange} />
      </div>

      {mode === "kanban" ? (
        <KanbanBoard
          businesses={filtered}
          canEdit={canEdit}
          onOpen={handleOpenDetail}
        />
      ) : (
        <BusinessList businesses={filtered} onOpen={handleOpenDetail} />
      )}

      <BusinessDetailDialog
        business={activeBusiness}
        zones={zones}
        canEdit={canEdit}
        canSeeContacts={canSeeContacts}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        allBusinesses={businesses}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
