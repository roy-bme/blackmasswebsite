import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function IntrosPage() {
  await requireModuleAccess("/indaba/intros");

  return (
    <EmptyState
      eyebrow="Module"
      title="Introductions"
      description="Coming in Phase 10 — BD intro pipeline with Roy-approval gate and warm-intro tracking."
    />
  );
}
