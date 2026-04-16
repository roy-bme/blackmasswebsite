"use client";

import { useState } from "react";

import MapActions from "./MapActions";
import MapFilters, { type MapFilter } from "./MapFilters";
import MapLegend from "./MapLegend";
import MapWrapper from "./MapWrapper";
import type {
  MapBusiness,
  MapIntroduction,
  MapLink,
  MapZone,
} from "./types";

type MapViewProps = {
  businesses: MapBusiness[];
  links: MapLink[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  canSeeIntros: boolean;
  canAddRecords: boolean;
  currentUserId: string;
};

export default function MapView({
  businesses,
  links,
  zones,
  introductions,
  canSeeIntros,
  canAddRecords,
  currentUserId,
}: MapViewProps) {
  const [filter, setFilter] = useState<MapFilter>("all");

  return (
    <div className="space-y-3">
      <MapFilters
        active={filter}
        onChange={setFilter}
        canSeeContacts={canSeeIntros}
      />

      <div className="relative overflow-hidden rounded-lg border border-zinc-200">
        <MapWrapper
          businesses={businesses}
          links={links}
          zones={zones}
          introductions={introductions}
          filter={filter}
          showIntros={canSeeIntros}
        />
        {canAddRecords ? (
          <MapActions
            zones={zones}
            businesses={businesses}
            currentUserId={currentUserId}
          />
        ) : null}
      </div>

      <MapLegend />
    </div>
  );
}
