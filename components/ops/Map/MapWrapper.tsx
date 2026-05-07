"use client";

import dynamic from "next/dynamic";

import type {
  MapBusiness,
  MapDiscoveryCandidate,
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
    <div className="indaba-map-placeholder h-[60vh] w-full md:h-[70vh]" />
  ),
});

type MapWrapperProps = {
  businesses: MapBusiness[];
  discoveryCandidates: MapDiscoveryCandidate[];
  links: MapLink[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  showBrendon: boolean;
  showTafadzwa: boolean;
  showUnattributed: boolean;
  showIntros: boolean;
  pinDropMode?: boolean;
  movingPinId?: string | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onEditBusiness?: (businessId: string) => void;
  onMoveBusiness?: (businessId: string) => void;
  onDeleteBusiness?: (businessId: string) => void;
  onLogInteraction?: (businessId: string) => void;
  onSelectBusiness?: (businessId: string) => void;
  showCandidates?: boolean;
  onOpenCandidate?: (candidateId: string) => void;
  flyToTarget?: { lat: number; lng: number; key: number } | null;
};

export default function MapWrapper(props: MapWrapperProps) {
  return <BulawayoMap {...props} />;
}
