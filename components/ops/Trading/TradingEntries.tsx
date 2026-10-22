'use client';
import { useState } from 'react';
import TradingForm from './TradingForm';
import type { TradingLink, BusinessOption } from '@/lib/ops/trading';
import Button from '@/components/ops/ui/Button';

export default function TradingEntries({ links, businesses }: { links: TradingLink[]; businesses: BusinessOption[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const names = new Map(businesses.map(b => [b.id, b.name]));
  return <div className="space-y-4">{links.length === 0 && <p>No trading links logged yet.</p>}
    {[...links].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).map(link => <article key={link.id} className="space-y-3 border border-line-15 p-4">
      <h3 className="break-words font-semibold">{names.get(link.seller_business_id ?? '') ?? 'Unknown seller'} → {names.get(link.buyer_business_id ?? '') ?? 'Unknown buyer'}</h3>
      <p className="break-words text-sm">{link.goods_or_service} · {link.status === 'confirmed' ? 'Confirmed by both sides' : 'Reported'}</p>
      <p className="text-sm text-fg-mute">{link.created_at ? new Date(link.created_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Harare' }) : 'Date not recorded'}</p>
      <Button onClick={() => setEditing(editing === link.id ? null : link.id)}>{editing === link.id ? 'Close editor' : 'Edit link'}</Button>
      {editing === link.id && <TradingForm key={link.id} initial={link} businesses={businesses} onSaved={() => setEditing(null)} />}
    </article>)}
  </div>;
}
