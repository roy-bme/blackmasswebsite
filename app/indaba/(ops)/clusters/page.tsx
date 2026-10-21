import PageHeader from '@/components/ops/PageHeader';
import Button from '@/components/ops/ui/Button';
import ClusterDiagram from '@/components/ops/Trading/ClusterDiagram';
import { requireModuleAccess } from '@/lib/ops/auth';
import { loadTradingData } from '@/lib/ops/trading-data';
import { tradingClusters } from '@/lib/ops/trading';
export const dynamic = 'force-dynamic';
export default async function ClustersPage() {
  const user = await requireModuleAccess('/indaba/clusters');
  let data;
  try { data = await loadTradingData(); }
  catch { return <div className="p-6" role="alert">Clusters could not be loaded. Please refresh to retry.</div>; }
  const clusters = tradingClusters(data.links);
  return <div><PageHeader eyebrow="indaba · confirmed trading" title="Clusters" caption={user.role === 'admin' ? 'All confirmed links · largest groups first' : 'Based on your confirmed links only'} actions={<Button href="/indaba/trading-links">Log a trading link</Button>} />
    <div className="grid gap-5 p-4 md:grid-cols-2 md:p-6">{clusters.length === 0 && <p>No connected groups of three or more businesses yet.</p>}
      {clusters.map((ids, i) => <section key={ids[0]} className="min-w-0 border border-line-15 p-4"><h2 className="mb-4 text-xl">Cluster {i + 1} · {ids.length} businesses</h2><ClusterDiagram ids={ids} {...data} /></section>)}
    </div>
  </div>;
}
