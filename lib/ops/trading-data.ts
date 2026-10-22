import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TradingLink, BusinessOption } from './trading';

export async function loadTradingData() {
  const db = createSupabaseServerClient();
  // Page through the PostgREST cap so large clusters and summaries aren't truncated.
  const links: TradingLink[] = [], businesses: BusinessOption[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('supply_chain_links')
      .select('id,buyer_business_id,seller_business_id,goods_or_service,trade_frequency,current_payment_method,payment_pain_note,buyer_contact_name,buyer_whatsapp,seller_contact_name,seller_whatsapp,status,created_by,created_at')
      .order('id').range(offset, offset + 999);
    if (error) throw new Error('Trading links could not be loaded. Please retry.');
    links.push(...data as TradingLink[]);
    if (data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('businesses').select('id,name').order('id').range(offset, offset + 999);
    if (error) throw new Error('Business directory could not be loaded. Please retry.');
    businesses.push(...data);
    if (data.length < 1000) break;
  }
  businesses.sort((a, b) => a.name.localeCompare(b.name));
  return { links, businesses };
}
