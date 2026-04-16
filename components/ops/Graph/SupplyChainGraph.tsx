"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getSectorHex, type SectorKey } from "@/lib/ops/sector-colors";
import type { Loop, SupplyChainLink } from "@/types/ops";

import type { GraphBusiness } from "./types";

type SupplyChainGraphProps = {
  businesses: GraphBusiness[];
  links: SupplyChainLink[];
  loops: Loop[];
};

type Point = { x: number; y: number };

type LaidOutNode = GraphBusiness & Point;

/**
 * SVG viewBox dimensions. We draw in a fixed 1000×500 coordinate space and
 * let the container scale the SVG responsively.
 */
const VB_WIDTH = 1000;
const VB_HEIGHT = 500;

const NODE_RADIUS = 8;
const NODE_RADIUS_LAUNCH6 = 10;

const LAYER_X_RATIO = [0.1, 0.37, 0.63, 0.9];

/**
 * Assign each sector to a vertical layer.
 * 0: producers (Manufacturing, Agriculture)
 * 1: intermediaries (Distribution)
 * 2: resellers (Wholesale, FMCG)
 * 3: end-use (Fuel, Hardware)
 */
const SECTOR_LAYER: Record<SectorKey, number> = {
  manufacturing: 0,
  agriculture: 0,
  distribution: 1,
  wholesale: 2,
  fmcg: 2,
  fuel: 3,
  hardware: 3,
  contact: 3,
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
}

function formatVolume(value: number | null | undefined): string {
  if (value == null) return "Volume n/a";
  return `$${Number(value).toLocaleString()}/mo`;
}

export default function SupplyChainGraph({
  businesses,
  links,
  loops,
}: SupplyChainGraphProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<
    | { x: number; y: number; business: GraphBusiness }
    | null
  >(null);

  const nodes = useMemo<LaidOutNode[]>(() => {
    const layers: GraphBusiness[][] = [[], [], [], []];
    for (const b of businesses) {
      const layer = SECTOR_LAYER[b.sector] ?? 0;
      layers[layer].push(b);
    }
    const result: LaidOutNode[] = [];
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const count = layer.length;
      const x = VB_WIDTH * LAYER_X_RATIO[li];
      for (let i = 0; i < count; i++) {
        // Even vertical spacing with a comfortable top/bottom margin.
        const y =
          count === 1
            ? VB_HEIGHT / 2
            : 40 + ((VB_HEIGHT - 80) * i) / (count - 1);
        result.push({ ...layer[i], x, y });
      }
    }
    return result;
  }, [businesses]);

  const nodeById = useMemo(() => {
    const map = new Map<string, LaidOutNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  /** Set of business ids that appear in any detected/validated/target loop. */
  const loopIds = useMemo(() => {
    const s = new Set<string>();
    for (const loop of loops) {
      for (const id of loop.business_ids ?? []) s.add(id);
    }
    return s;
  }, [loops]);

  const edges = useMemo(() => {
    return links
      .filter((l) => l.supplier_id && l.buyer_id)
      .map((l) => {
        const supplier = nodeById.get(l.supplier_id as string);
        const buyer = nodeById.get(l.buyer_id as string);
        if (!supplier || !buyer) return null;
        const inLoop =
          loopIds.has(supplier.id) && loopIds.has(buyer.id);
        return { link: l, supplier, buyer, inLoop };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [links, nodeById, loopIds]);

  function handleNodeClick(id: string) {
    router.push(`/indaba/directory?id=${id}`);
  }

  function handleNodeEnter(node: LaidOutNode) {
    setHoveredId(node.id);
    setTooltip({ x: node.x, y: node.y, business: node });
  }

  function handleNodeLeave() {
    setHoveredId(null);
    setTooltip(null);
  }

  const hoveredConnections = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const s = new Set<string>();
    for (const l of links) {
      if (l.supplier_id === hoveredId && l.buyer_id) s.add(l.buyer_id);
      if (l.buyer_id === hoveredId && l.supplier_id) s.add(l.supplier_id);
    }
    return s;
  }, [hoveredId, links]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white md:h-[400px]">
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Supply chain graph"
      >
        <defs>
          <marker
            id="arrow-normal"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#9CA3AF" />
          </marker>
          <marker
            id="arrow-loop"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#D4AF37" />
          </marker>
          <marker
            id="arrow-hover"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#1B1B1B" />
          </marker>
        </defs>

        {edges.map((e) => {
          const isHovered =
            hoveredId != null &&
            (e.supplier.id === hoveredId || e.buyer.id === hoveredId);
          const { stroke, width, marker } = edgeStyle(e.inLoop, isHovered);
          // Shorten the line so the arrow tip lands at the node edge rather
          // than inside the circle.
          const r =
            (e.buyer.launch_6 ? NODE_RADIUS_LAUNCH6 : NODE_RADIUS) + 2;
          const dx = e.buyer.x - e.supplier.x;
          const dy = e.buyer.y - e.supplier.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const endX = e.buyer.x - (dx / dist) * r;
          const endY = e.buyer.y - (dy / dist) * r;
          return (
            <line
              key={e.link.id}
              x1={e.supplier.x}
              y1={e.supplier.y}
              x2={endX}
              y2={endY}
              stroke={stroke}
              strokeWidth={width}
              markerEnd={`url(#${marker})`}
            />
          );
        })}

        {nodes.map((n) => {
          const radius = n.launch_6 ? NODE_RADIUS_LAUNCH6 : NODE_RADIUS;
          const isHovered = hoveredId === n.id;
          const isConnected = hoveredConnections.has(n.id);
          const dim =
            hoveredId != null && !isHovered && !isConnected ? 0.35 : 1;
          return (
            <g
              key={n.id}
              style={{ cursor: "pointer", opacity: dim }}
              onMouseEnter={() => handleNodeEnter(n)}
              onMouseLeave={handleNodeLeave}
              onClick={() => handleNodeClick(n.id)}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={radius}
                fill={getSectorHex(n.sector)}
                stroke={n.launch_6 ? "#D4AF37" : "#1B1B1B"}
                strokeWidth={n.launch_6 ? 3 : 1}
              />
              <text
                x={n.x + radius + 4}
                y={n.y + 3}
                fontSize="11"
                fill="#3F3F46"
                className="select-none"
              >
                {truncate(n.name, 18)}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[140px] border border-zinc-200 bg-white px-3 py-2 shadow-md"
          style={{
            left: `${(tooltip.x / VB_WIDTH) * 100}%`,
            top: `${(tooltip.y / VB_HEIGHT) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <p className="text-[12px] font-medium text-zimx-black">
            {tooltip.business.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-tag text-zinc-500">
            {tooltip.business.sector}
            {" \u00B7 "}
            {formatVolume(tooltip.business.est_monthly_volume)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function edgeStyle(inLoop: boolean, isHovered: boolean) {
  if (isHovered) {
    return { stroke: "#1B1B1B", width: 2.5, marker: "arrow-hover" };
  }
  if (inLoop) {
    return { stroke: "#D4AF37", width: 2.5, marker: "arrow-loop" };
  }
  return { stroke: "#D1D5DB", width: 1, marker: "arrow-normal" };
}
