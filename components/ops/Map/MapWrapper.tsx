"use client";

import dynamic from "next/dynamic";

import type { MapFilter } from "./MapFilters";
import type {
  MapBusiness,
  MapIntroduction,
  MapLink,
  MapZone,
} from "./types";

// Leaflet touches `window` at module load, so the actual map component is
// dynamically imported with ssr:false. Anything statically importing this
// wrapper still needs to be a client component.
const BulawayoMap = dynamic(() => import("./BulawayoMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full animate-pulse bg-zinc-100 md:h-[70vh]" />
  ),
});

type MapWrapperProps = {
  businesses: MapBusiness[];
  links: MapLink[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  filter: MapFilter;
  showIntros: boolean;
};

export default function MapWrapper(props: MapWrapperProps) {
  return <BulawayoMap {...props} />;
}
