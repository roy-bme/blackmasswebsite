"use client";

import { useMemo, useState } from "react";

import EmptyState from "@/components/ops/ui/EmptyState";
import { SECTOR_LIST, type SectorKey } from "@/lib/ops/sector-colors";
import type { Loop, SupplyChainLink } from "@/types/ops";

import GraphControls from "./GraphControls";
import LoopsList from "./LoopsList";
import SupplyChainGraph from "./SupplyChainGraph";
import type { GraphBusiness } from "./types";

type GraphViewProps = {
  businesses: GraphBusiness[];
  links: SupplyChainLink[];
  loops: Loop[];
  isAdmin: boolean;
};

/**
 * Sectors that actually appear on the graph. `Contact` is the introduction
 * diamond colour on the map and isn't assigned to businesses, so we exclude
 * it from the filter chips.
 */
const GRAPH_SECTORS: SectorKey[] = SECTOR_LIST.map((s) => s.key).filter(
  (key) => key !== "contact",
);

export default function GraphView({
  businesses,
  links,
  loops,
  isAdmin,
}: GraphViewProps) {
  const [hiddenSectors, setHiddenSectors] = useState<Set<SectorKey>>(
    () => new Set(),
  );

  function toggleSector(key: SectorKey) {
    setHiddenSectors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const visibleBusinesses = useMemo(
    () => businesses.filter((b) => !hiddenSectors.has(b.sector)),
    [businesses, hiddenSectors],
  );

  const visibleIds = useMemo(
    () => new Set(visibleBusinesses.map((b) => b.id)),
    [visibleBusinesses],
  );

  const visibleLinks = useMemo(
    () =>
      links.filter(
        (l) =>
          l.supplier_id &&
          l.buyer_id &&
          visibleIds.has(l.supplier_id) &&
          visibleIds.has(l.buyer_id),
      ),
    [links, visibleIds],
  );

  if (businesses.length === 0) {
    return (
      <EmptyState
        eyebrow="Supply chain"
        title="No businesses yet"
        description="Map businesses in the directory or on the map to start building the supply-chain graph."
      />
    );
  }

  return (
    <div className="space-y-4">
      <GraphControls
        sectors={GRAPH_SECTORS}
        hiddenSectors={hiddenSectors}
        onToggleSector={toggleSector}
      />

      <SupplyChainGraph
        businesses={visibleBusinesses}
        links={visibleLinks}
        loops={loops}
      />

      <LoopsList businesses={businesses} loops={loops} isAdmin={isAdmin} />
    </div>
  );
}
