import { jsonError, jsonOk, readJson, withOpsWrite } from '@/lib/server/ops-handler';
import { parseTradingLink, UUID } from '@/lib/ops/trading';

export async function POST(request: Request) {
  return withOpsWrite(request, { module: '/indaba/trading-links', roles: ['admin', 'ops', 'bd'] }, async ({ user, supabase }) => {
    const body = await readJson<Record<string, unknown>>(request);
    let values;
    try { values = parseTradingLink(body); }
    catch (error) { return jsonError(400, error instanceof Error ? error.message : 'Invalid form.'); }
    if (body?.id != null && (typeof body.id !== 'string' || !UUID.test(body.id))) return jsonError(400, 'Invalid link.');
    const query = body?.id
      ? supabase.from('supply_chain_links').update(values).eq('id', body.id)
      : supabase.from('supply_chain_links').insert({ ...values, created_by: user.id });
    // Session client: RLS applies to both reads and writes, including direct API calls.
    const { data, error } = await query.select('id').maybeSingle();
    if (error) return jsonError(400, 'Could not save. Check the businesses and try again.');
    if (!data) return jsonError(404, 'Link not found or not editable.');
    return jsonOk(data);
  });
}
