import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function GraphPage() {
  await requireModuleAccess("/indaba/graph");

  return (
    <EmptyState
      eyebrow="Module"
      title="Supply chain"
      description="Coming in Phase 9 — visualise supplier → buyer links and detect closed-loop opportunities."
    />
  );
}
