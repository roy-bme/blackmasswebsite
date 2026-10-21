import PageHeader from '@/components/ops/PageHeader';
import Button from '@/components/ops/ui/Button';
import TradingForm from '@/components/ops/Trading/TradingForm';
import TradingEntries from '@/components/ops/Trading/TradingEntries';
import { requireModuleAccess } from '@/lib/ops/auth';
import { loadTradingData } from '@/lib/ops/trading-data';

export const dynamic = 'force-dynamic';
export default async function TradingLinksPage() {
  const user = await requireModuleAccess('/indaba/trading-links');
  let data;
  try { data = await loadTradingData(); }
  catch { return <div className="p-6" role="alert">Trading links could not be loaded. Please refresh to retry.</div>; }
  return <div>
    <PageHeader eyebrow="indaba · bulawayo" title="Trading Links" caption={user.role === 'admin' ? 'All team entries' : 'Your entries'} actions={<Button href="/indaba/clusters">View clusters</Button>} />
    <div className="grid gap-8 p-4 md:p-6 xl:grid-cols-2">
      <section className="min-w-0"><h2 className="mb-4 text-xl">Log a trading link</h2><TradingForm businesses={data.businesses} /></section>
      <section className="min-w-0"><h2 className="mb-4 text-xl">{user.role === 'admin' ? 'Team' : 'Your'} trading links</h2><TradingEntries {...data} /></section>
    </div>
  </div>;
}
