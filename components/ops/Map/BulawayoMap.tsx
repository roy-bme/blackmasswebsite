"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/ops/cn";
import { getSectorHex } from "@/lib/ops/sector-colors";

import type { MapFilter } from "./MapFilters";
import type {
  MapBusiness,
  MapIntroduction,
  MapLink,
  MapZone,
} from "./types";

type BulawayoMapProps = {
  businesses: MapBusiness[];
  links: MapLink[];
  zones: MapZone[];
  introductions: MapIntroduction[];
  filter: MapFilter;
  showIntros: boolean;
  pinDropMode?: boolean;
  movingPinId?: string | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onEditBusiness?: (businessId: string) => void;
  onMoveBusiness?: (businessId: string) => void;
  onDeleteBusiness?: (businessId: string) => void;
  onLogInteraction?: (businessId: string) => void;
};

type ZonePolygon = {
  name: string;
  coordinates: [number, number][];
  color: string;
};

// Hard-coded polygon overlays for the four priority zones. The `zones`
// table still supplies the id → name lookup for business pins; these shapes
// are kept in the client because Supabase only stores centre points, not the
// full boundary geometry.
const ZONE_POLYGONS: ZonePolygon[] = [
  {
    name: "CBD Core",
    coordinates: [
      [-20.144, 28.575],
      [-20.144, 28.59],
      [-20.158, 28.59],
      [-20.158, 28.575],
    ],
    color: "#378ADD",
  },
  {
    name: "Belmont Industrial",
    coordinates: [
      [-20.162, 28.558],
      [-20.162, 28.58],
      [-20.18, 28.58],
      [-20.18, 28.558],
    ],
    color: "#E24B4A",
  },
  {
    name: "Donnington",
    coordinates: [
      [-20.135, 28.545],
      [-20.135, 28.558],
      [-20.148, 28.558],
      [-20.148, 28.545],
    ],
    color: "#BA7517",
  },
  {
    name: "Kelvin",
    coordinates: [
      [-20.16, 28.528],
      [-20.16, 28.55],
      [-20.18, 28.55],
      [-20.18, 28.528],
    ],
    color: "#888780",
  },
];

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Deterministic jitter so intro pins don't jump every render. Keyed by the
// intro id; returns a value in the range (-0.002, 0.002).
function hashJitter(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const n = (h >>> 0) % 1000;
  return (n / 1000) * 0.004 - 0.002;
}

export default function BulawayoMap({
  businesses,
  links,
  zones,
  introductions,
  filter,
  showIntros,
  pinDropMode = false,
  movingPinId = null,
  onMapClick,
  onEditBusiness,
  onMoveBusiness,
  onDeleteBusiness,
  onLogInteraction,
}: BulawayoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const layersRef = useRef<{
    zones: L.LayerGroup;
    links: L.LayerGroup;
    businesses: L.LayerGroup;
    introductions: L.LayerGroup;
  } | null>(null);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const zoneNameById = useMemo(
    () => new Map(zones.map((z) => [z.id, z.name])),
    [zones],
  );

  // One-time map init + zone polygons (they never change with filters).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-20.155, 28.575],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(map);

    const zonesLayer = L.layerGroup().addTo(map);
    const linksLayer = L.layerGroup().addTo(map);
    const businessesLayer = L.layerGroup().addTo(map);
    const introductionsLayer = L.layerGroup().addTo(map);

    for (const zone of ZONE_POLYGONS) {
      L.polygon(zone.coordinates, {
        color: zone.color,
        weight: 1,
        fillColor: zone.color,
        fillOpacity: 0.08,
      })
        .bindTooltip(zone.name, { sticky: true })
        .addTo(zonesLayer);
    }

    mapRef.current = map;
    layersRef.current = {
      zones: zonesLayer,
      links: linksLayer,
      businesses: businessesLayer,
      introductions: introductionsLayer,
    };

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.businesses.clearLayers();
    layers.links.clearLayers();
    layers.introductions.clearLayers();

    const sectorFilter =
      filter === "all" || filter === "contacts" ? null : filter;
    const showBusinessLayer = filter !== "contacts";
    const showIntroLayer =
      showIntros && (filter === "all" || filter === "contacts");
    const showLinkLayer = filter === "all";

    if (showBusinessLayer) {
      for (const b of businesses) {
        if (sectorFilter && b.sector !== sectorFilter) continue;
        if (b.lat == null || b.lng == null) continue;

        const volume = b.est_monthly_volume ?? 0;
        const radius = Math.max(
          6,
          Math.min(14, Math.log10(Math.max(1000, volume || 1000)) * 2),
        );
        const fillColor = getSectorHex(b.sector);
        const strokeColor = b.launch_6 ? "#D4AF37" : fillColor;
        const strokeWeight = b.launch_6 ? 3 : 1;
        const zoneName = b.zone_id ? zoneNameById.get(b.zone_id) ?? "—" : "—";
        const notes =
          b.notes && b.notes.length > 120
            ? `${b.notes.slice(0, 120)}…`
            : b.notes ?? "";

        const popupHtml = `
          <div style="font-size:14px; min-width:200px; line-height:1.4;">
            <div style="font-weight:600; font-size:14px; color:#1B1B1B;">${escapeHtml(b.name)}</div>
            <div style="color:#666; font-size:12px; text-transform:capitalize; margin-top:2px;">${escapeHtml(b.sector)} · ${escapeHtml(zoneName)}</div>
            <div style="color:#1B1B1B; font-size:13px; margin-top:4px;">$${volume.toLocaleString()}/mo</div>
            ${notes ? `<div style="color:#555; font-size:12px; margin-top:4px;">${escapeHtml(notes)}</div>` : ""}
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button type="button" data-action="edit" data-business-id="${escapeHtml(b.id)}" style="font-size:12px; color:#0B6BFF; background:none; border:0; padding:0; font-weight:600; cursor:pointer;">Edit</button>
              <button type="button" data-action="move" data-business-id="${escapeHtml(b.id)}" style="font-size:12px; color:#A46A00; background:none; border:0; padding:0; font-weight:600; cursor:pointer;">Move Pin</button>
              <button type="button" data-action="delete" data-business-id="${escapeHtml(b.id)}" style="font-size:12px; color:#B42318; background:none; border:0; padding:0; font-weight:600; cursor:pointer;">Delete</button>
              <button type="button" data-action="log" data-business-id="${escapeHtml(b.id)}" style="font-size:12px; color:#0F766E; background:none; border:0; padding:0; font-weight:600; cursor:pointer;">+ Log Interaction</button>
            </div>
          </div>
        `;

        const marker = L.circleMarker([b.lat, b.lng], {
          radius,
          fillColor,
          fillOpacity: 0.85,
          color: strokeColor,
          weight: strokeWeight,
        });

        marker.bindPopup(popupHtml).on("popupopen", (event) => {
          const el = event.popup.getElement();
          if (!el) return;
          const buttons = el.querySelectorAll<HTMLButtonElement>("button[data-action]");
          buttons.forEach((btn) => {
            btn.onclick = () => {
              const action = btn.dataset.action;
              const businessId = btn.dataset.businessId;
              if (!businessId) return;
              if (action === "edit") onEditBusiness?.(businessId);
              if (action === "move") onMoveBusiness?.(businessId);
              if (action === "delete") onDeleteBusiness?.(businessId);
              if (action === "log") onLogInteraction?.(businessId);
            };
          });
        }).addTo(layers.businesses);
      }
    }

    if (showLinkLayer) {
      for (const link of links) {
        if (!link.supplier || !link.buyer) continue;
        const volume = link.est_monthly_volume ?? 0;
        const weight = Math.max(
          1,
          Math.log10(Math.max(1000, volume || 1000)) * 0.5,
        );
        const tooltipHtml = `
          <div style="font-size:13px; line-height:1.4;">
            <div style="font-weight:600;">${escapeHtml(link.product ?? "Supply link")}</div>
            <div style="margin-top:2px;">$${volume.toLocaleString()}/mo</div>
            ${link.payment_frequency ? `<div style="color:#666; text-transform:capitalize;">${escapeHtml(link.payment_frequency)}</div>` : ""}
          </div>
        `;

        L.polyline(
          [
            [link.supplier.lat, link.supplier.lng],
            [link.buyer.lat, link.buyer.lng],
          ],
          {
            color: "#888780",
            weight,
            opacity: 0.4,
          },
        )
          .bindTooltip(tooltipHtml, { sticky: true })
          .addTo(layers.links);
      }
    }

    if (showIntroLayer) {
      const businessById = new Map(businesses.map((b) => [b.id, b]));
      for (const intro of introductions) {
        let lat: number;
        let lng: number;

        const linkedBiz = intro.business_id
          ? businessById.get(intro.business_id)
          : null;
        if (linkedBiz) {
          lat = linkedBiz.lat + hashJitter(intro.id, 17);
          lng = linkedBiz.lng + hashJitter(intro.id, 91);
        } else {
          lat = -20.15 + hashJitter(intro.id, 17) * 2.5;
          lng = 28.582 + hashJitter(intro.id, 91) * 2.5;
        }

        const icon = L.divIcon({
          className: "indaba-intro-marker",
          html: '<div style="width:12px;height:12px;background:#D4AF37;transform:rotate(45deg);border:2px solid #14161a;box-shadow:0 1px 2px rgba(0,0,0,0.4);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const popupHtml = `
          <div style="font-size:14px; min-width:180px; line-height:1.4;">
            <div style="font-weight:600; color:#1B1B1B;">${escapeHtml(intro.contact_name)}</div>
            <div style="color:#666; font-size:12px; margin-top:2px;">${escapeHtml(intro.role ?? "—")} · ${escapeHtml(intro.business ?? "—")}</div>
            <div style="color:#555; font-size:12px; margin-top:4px;">via ${escapeHtml(intro.introduced_by_name)}</div>
            <span style="display:inline-block; margin-top:6px; padding:2px 8px; border:1px solid #D4AF37; color:#B19631; font-family:ui-monospace, Menlo, monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.08em;">${escapeHtml(intro.warmth)}</span>
          </div>
        `;

        L.marker([lat, lng], { icon })
          .bindPopup(popupHtml)
          .addTo(layers.introductions);
      }
    }
  }, [businesses, links, introductions, filter, showIntros, zoneNameById, onEditBusiness, onMoveBusiness, onDeleteBusiness, onLogInteraction]);

  // Pin-drop mode: install a one-shot click handler.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pinDropMode) {
      const handler = (event: L.LeafletMouseEvent) => {
        onMapClickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
      };
      map.on("click", handler);
      return () => {
        map.off("click", handler);
      };
    }
    return undefined;
  }, [pinDropMode]);

  return (
    <div
      className={cn(
        "h-[60vh] w-full md:h-[70vh]",
        (pinDropMode || movingPinId) && "indaba-pin-drop-cursor",
      )}
    >
      {/* Wrapper needed: Leaflet mutates containerRef's className (adds
          leaflet-container, leaflet-touch, etc). React re-renders will wipe
          these if we put dynamic classes on the ref'd element. Keep dynamic
          classes on this wrapper, leave inner div alone. */}
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Bulawayo business map"
      />
    </div>
  );
}
