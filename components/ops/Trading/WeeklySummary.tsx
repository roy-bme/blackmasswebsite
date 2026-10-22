import Button from '@/components/ops/ui/Button';
import { loadTradingData } from '@/lib/ops/trading-data';
import { weeklyCounts, tradingClusters } from '@/lib/ops/trading';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export default async function WeeklySummary({ isAdmin }: { isAdmin: boolean }) {
  try {
    const { links } = await loadTradingData();
    const { data: users, error } = await createSupabaseServerClient().from('users').select('id,name');
    if (error) throw error;
    const names = new Map(users.map(u => [u.id, u.name]));
    const rows = weeklyCounts(links);
    return <section className="mt-5 space-y-3 border border-line-15 p-4">
      <h2 className="text-xl">Trading this week</h2>
      <p className="text-sm text-fg-mute">Monday–Sunday · Zimbabwe time · {isAdmin ? 'All team entries' : 'Your entries only'}</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">User</th><th className="p-2">Logged</th><th className="p-2">Reported</th><th className="p-2">Confirmed</th></tr></thead><tbody>
        {rows.map(r => <tr key={r.id}><td className="p-2">{names.get(r.id) ?? 'Unattributed'}</td><td className="p-2">{r.reported + r.confirmed}</td><td className="p-2">{r.reported}</td><td className="p-2">{r.confirmed}</td></tr>)}
        {rows.length === 0 && <tr><td colSpan={4} className="p-2">No links logged this week.</td></tr>}
      </tbody></table></div>
      <p>{tradingClusters(links).length} clusters of 3+ businesses · all-time confirmed links</p>
      <div className="flex flex-wrap gap-2"><Button href="/indaba/trading-links" variant="primary">Log trading link</Button><Button href="/indaba/clusters">View clusters</Button></div>
    </section>;
  } catch { return <p role="alert" className="mt-5 p-4">Trading summary unavailable. Please refresh to retry.</p>; }
}
