import { jsonError, jsonOk, readJson, withOpsWrite } from '@/lib/server/ops-handler';

export async function POST(request: Request) {
  return withOpsWrite(request, { module: '/indaba/trading-links', roles: ['admin', 'ops', 'bd'] }, async ({ user, supabase }) => {
    const body = await readJson<{ name?: unknown }>(request);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 200) return jsonError(400, 'Enter a business name (up to 200 characters).');
    const { data, error } = await supabase.from('businesses').insert({
      name, sector: 'unknown', lat: null, lng: null, type: null,
      mapped_by: user.id, onboarding_stage: 'identified', source: 'ground_team',
    }).select('id,name').single();
    if (error) return jsonError(400, 'Could not add business. Please retry.');
    return jsonOk(data);
  });
}
