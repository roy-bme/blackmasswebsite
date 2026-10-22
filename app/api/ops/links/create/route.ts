import { jsonError, withOpsWrite } from '@/lib/server/ops-handler';

// Retire the old service-role write path; all entry now uses the RLS-scoped form.
export async function POST(request: Request) {
  return withOpsWrite(request, { module: '/indaba/trading-links', roles: ['admin', 'ops', 'bd'] }, async () =>
    jsonError(410, 'Please use the Trading Links page to log this relationship.'));
}
