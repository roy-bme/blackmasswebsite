"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { UserRole } from "@/types/ops";

import BusinessDetailDialog from "./BusinessDetailDialog";
import BusinessList from "./BusinessList";
import DirectoryFilters, { type ChipFilter } from "./DirectoryFilters";
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

  const [chip, setChip] = useState<ChipFilter>("all");
  const [sector, setSector] = useState<string>("");
  const [zoneId, setZoneId] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [mode, setMode] = useState<DirectoryViewMode>(initialViewMode);
  const [modeOverridden, setModeOverridden] = useState(false);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

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
    const query = search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (chip === "launch6" && !b.launch_6) return false;
      if (chip === "formal" && b.type !== "formal") return false;
      if (chip === "informal" && b.type !== "informal") return false;
      if (chip === "incomplete") {
        const incomplete = !b.decision_maker_name || !b.phone;
        if (!incomplete) return false;
      }
      if (sector && b.sector !== sector) return false;
      if (zoneId && b.zone_id !== zoneId) return false;
      if (query && !b.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [businesses, chip, sector, zoneId, search]);

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
          chip={chip}
          sector={sector}
          zoneId={zoneId}
          search={search}
          zones={zones}
          onChip={setChip}
          onSector={setSector}
          onZone={setZoneId}
          onSearch={setSearch}
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
