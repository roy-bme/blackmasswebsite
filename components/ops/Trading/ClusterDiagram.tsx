import type { TradingLink, BusinessOption } from '@/lib/ops/trading';
export default function ClusterDiagram({ ids, links, businesses }: { ids: string[]; links: TradingLink[]; businesses: BusinessOption[] }) {
  const names = new Map(businesses.map(b => [b.id, b.name]));
  const size = Math.max(320, ids.length * 24), radius = size / 2 - 35;
  const points = new Map(ids.map((id, i) => [id, { x: size / 2 + radius * Math.cos(i * 2 * Math.PI / ids.length), y: size / 2 + radius * Math.sin(i * 2 * Math.PI / ids.length) }]));
  const edges = new Map<string, [string, string]>();
  for (const l of links) if (l.status === 'confirmed' && l.buyer_business_id && l.seller_business_id && points.has(l.buyer_business_id) && points.has(l.seller_business_id)) {
    const pair = [l.buyer_business_id, l.seller_business_id].sort() as [string, string]; edges.set(pair.join(':'), pair);
  }
  return <div>
    <div className="overflow-x-auto"><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Network of ${ids.length} businesses; numbered names listed below`} className="mx-auto">
      {[...edges].map(([key, [a, b]]) => <line key={key} x1={points.get(a)!.x} y1={points.get(a)!.y} x2={points.get(b)!.x} y2={points.get(b)!.y} stroke="#8b826d" strokeWidth="2" />)}
      {ids.map((id, i) => <g key={id}><title>{names.get(id) ?? id}</title><circle cx={points.get(id)!.x} cy={points.get(id)!.y} r="17" fill="#c8a951" /><text x={points.get(id)!.x} y={points.get(id)!.y + 5} textAnchor="middle" fontSize="14" fill="#111">{i + 1}</text></g>)}
    </svg></div>
    <ol className="ml-6 list-decimal space-y-1">{ids.map(id => <li className="break-words" key={id}>{names.get(id) ?? `Business ${id}`}</li>)}</ol>
    <p className="mt-3 text-sm text-fg-mute">Lines show confirmed trading relationships.</p>
  </div>;
}
