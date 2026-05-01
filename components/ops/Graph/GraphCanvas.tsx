"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { getSectorHex } from "@/lib/ops/sector-colors";
import type { Business, SupplyChainLink } from "@/types/ops";

type BizLite = Pick<Business, "id" | "name" | "sector" | "launch_6">;

type Pos = { x: number; y: number; b: BizLite };

type Rail = { y: number; label: string; sector: string };

type Tooltip = {
  x: number;
  y: number;
  text: string;
};

type GraphCanvasProps = {
  rails: Rail[];
  positions: Pos[];
  links: SupplyChainLink[];
  businessById: Record<string, BizLite>;
  loopMembers: string[];
};

export default function GraphCanvas({
  rails,
  positions,
  links,
  businessById,
  loopMembers,
}: GraphCanvasProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const positionMap: Record<string, Pos> = Object.fromEntries(
    positions.map((p) => [p.b.id, p]),
  );
  const loopSet = new Set(loopMembers);

  function handleNodeClick(businessId: string) {
    router.push(`/indaba/directory?id=${businessId}`);
  }

  function handleLinkHover(
    e: MouseEvent<SVGPathElement>,
    link: SupplyChainLink,
  ) {
    const supplier = link.supplier_id
      ? businessById[link.supplier_id]?.name ?? "?"
      : "?";
    const buyer = link.buyer_id
      ? businessById[link.buyer_id]?.name ?? "?"
      : "?";
    const product = link.product ? ` · ${link.product}` : "";
    const volume = link.est_monthly_volume
      ? ` · $${Number(link.est_monthly_volume).toLocaleString()}/mo`
      : "";
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setTooltip({
      x,
      y,
      text: `${supplier} → ${buyer}${product}${volume}`,
    });
  }

  return (
    <div className="relative">
      <svg
        viewBox="0 0 880 700"
        className="block h-[480px] w-full md:h-[640px]"
      >
        {rails.map((r) => (
          <g key={r.label}>
            <line
              x1={40}
              y1={r.y}
              x2={840}
              y2={r.y}
              stroke={getSectorHex(r.sector)}
              strokeOpacity={0.18}
              strokeDasharray="2 6"
            />
            <text
              x={40}
              y={r.y - 18}
              fill={getSectorHex(r.sector)}
              fontFamily="monospace"
              fontSize={10}
              letterSpacing={2}
            >
              {r.label.toUpperCase()}
            </text>
          </g>
        ))}
        {links.map((link) => {
          if (!link.supplier_id || !link.buyer_id) return null;
          const a = positionMap[link.supplier_id];
          const b = positionMap[link.buyer_id];
          if (!a || !b) return null;
          const isLoop = loopSet.has(a.b.id) && loopSet.has(b.b.id);
          return (
            <path
              key={link.id}
              d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 30} ${b.x} ${b.y}`}
              stroke={isLoop ? "#D4AF37" : "rgba(255,255,255,0.18)"}
              strokeWidth={isLoop ? 1.6 : 1}
              fill="none"
              className="cursor-pointer hover:stroke-white"
              onMouseEnter={(e) => handleLinkHover(e, link)}
              onMouseMove={(e) => handleLinkHover(e, link)}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
        {positions.map(({ x, y, b }) => (
          <g
            key={b.id}
            className="cursor-pointer"
            onClick={() => handleNodeClick(b.id)}
          >
            <circle
              cx={x}
              cy={y}
              r={9}
              fill={getSectorHex(b.sector)}
              stroke={loopSet.has(b.id) ? "#D4AF37" : "#14161a"}
              strokeWidth={2}
            />
            <text
              x={x}
              y={y + 22}
              fill="#fff"
              fontSize={10}
              textAnchor="middle"
            >
              {b.name.length > 16 ? `${b.name.slice(0, 14)}…` : b.name}
            </text>
            <title>{b.name}</title>
          </g>
        ))}
      </svg>
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 max-w-xs border border-line-15 bg-ink-900/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-white shadow-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
}
