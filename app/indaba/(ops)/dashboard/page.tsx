import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

type DashboardPageProps = {
  searchParams: { flash?: string };
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireModuleAccess("/indaba/dashboard");

  const flash = searchParams.flash
    ? decodeURIComponent(searchParams.flash)
    : null;

  return (
    <div className="space-y-6">
      {flash ? (
        <div
          role="alert"
          className="border border-zimx-gold/40 bg-zimx-gold/10 px-4 py-3 font-mono text-[12px] uppercase tracking-tag text-zimx-black"
        >
          {flash}
        </div>
      ) : null}

      <EmptyState
        eyebrow={`Signed in as ${user.name}`}
        title="Dashboard"
        description="Coming in Phase 6 — pipeline KPIs, zone progress, and the live ops feed preview will live here."
      />
    </div>
  );
}
