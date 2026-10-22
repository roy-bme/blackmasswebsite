export const TRADE_FREQUENCIES = ['weekly', 'fortnightly', 'monthly', 'ad hoc'] as const;
export const PAYMENT_METHODS = ['cash', 'EcoCash', 'bank transfer', 'credit', 'other'] as const;
export type TradingLink = {
  id: string;
  buyer_business_id: string | null;
  seller_business_id: string | null;
  goods_or_service: string | null;
  trade_frequency: string | null;
  current_payment_method: string | null;
  payment_pain_note: string | null;
  buyer_contact_name: string | null;
  buyer_whatsapp: string | null;
  seller_contact_name: string | null;
  seller_whatsapp: string | null;
  status: 'reported' | 'confirmed';
  created_by: string | null;
  created_at: string | null;
};
export type BusinessOption = { id: string; name: string };
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseTradingLink(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid form.');
  const v = value as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    if (v[key] != null && typeof v[key] !== 'string') throw new Error(`Invalid ${key}.`);
    const s = ((v[key] as string) ?? '').trim();
    if ((required && !s) || s.length > max) throw new Error(`Please check ${key.replaceAll('_', ' ')}.`);
    return s || null;
  };
  const buyer = text('buyer_business_id', 36, true)!;
  const seller = text('seller_business_id', 36, true)!;
  if (!UUID.test(buyer) || !UUID.test(seller) || buyer === seller) throw new Error('Choose two different businesses.');
  if (!TRADE_FREQUENCIES.some(x => x === v.trade_frequency)) throw new Error('Choose a trade frequency.');
  if (!PAYMENT_METHODS.some(x => x === v.current_payment_method)) throw new Error('Choose a payment method.');
  if (v.status !== 'reported' && v.status !== 'confirmed') throw new Error('Choose a status.');
  if (v.status === 'confirmed' && v.confirmed_by_both !== true) throw new Error('Confirm that you checked with both sides.');
  const phone = (key: string) => {
    const s = text(key, 40);
    if (s && !/^\+?[\d\s()-]{7,40}$/.test(s)) throw new Error('Enter a valid WhatsApp number.');
    return s;
  };
  return {
    buyer_business_id: buyer, seller_business_id: seller,
    goods_or_service: text('goods_or_service', 500, true),
    trade_frequency: v.trade_frequency as string,
    current_payment_method: v.current_payment_method as string,
    payment_pain_note: text('payment_pain_note', 2000),
    buyer_contact_name: text('buyer_contact_name', 160), buyer_whatsapp: phone('buyer_whatsapp'),
    seller_contact_name: text('seller_contact_name', 160), seller_whatsapp: phone('seller_whatsapp'),
    status: v.status,
  };
}

// Connectivity is undirected: a chain A -> B -> C is a cluster, not only a cycle.
export function tradingClusters(links: Pick<TradingLink, 'buyer_business_id' | 'seller_business_id' | 'status'>[]) {
  const adjacency = new Map<string, Set<string>>();
  for (const l of links) {
    const a = l.buyer_business_id, b = l.seller_business_id;
    if (l.status !== 'confirmed' || !a || !b || a === b) continue;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b); adjacency.get(b)!.add(a);
  }
  const seen = new Set<string>(), groups: string[][] = [];
  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue;
    const group: string[] = [], queue = [start]; seen.add(start);
    while (queue.length) {
      const id = queue.pop()!; group.push(id);
      for (const next of adjacency.get(id)!) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    if (group.length >= 3) groups.push(group.sort());
  }
  return groups.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

// Harare is UTC+02 year-round. Week starts Monday 00:00 local time.
export function harareWeek(now = new Date()) {
  const local = new Date(now.getTime() + 2 * 3600000);
  const day = (local.getUTCDay() + 6) % 7;
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day) - 2 * 3600000;
  return { start: new Date(start).toISOString(), end: new Date(start + 7 * 86400000).toISOString() };
}
export function weeklyCounts(links: Pick<TradingLink, 'created_at' | 'created_by' | 'status'>[], now = new Date()) {
  const { start, end } = harareWeek(now);
  const counts = new Map<string, { reported: number; confirmed: number }>();
  for (const l of links) {
    const timestamp = Date.parse(l.created_at ?? '');
    if (!Number.isFinite(timestamp) || timestamp < Date.parse(start) || timestamp >= Date.parse(end)) continue;
    const key = l.created_by ?? 'unattributed';
    const row = counts.get(key) ?? { reported: 0, confirmed: 0 };
    row[l.status]++; counts.set(key, row);
  }
  return [...counts].map(([id, counts]) => ({ id, ...counts })).sort((a, b) => (b.reported + b.confirmed) - (a.reported + a.confirmed));
}
