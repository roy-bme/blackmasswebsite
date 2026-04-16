import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function MapPage() {
  await requireModuleAccess("/indaba/map");

  return (
    <EmptyState
      eyebrow="Module"
      title="Map"
      description="Coming in Phase 7 — interactive Bulawayo map with zones, businesses, and sector filters."
    />
  );
}
