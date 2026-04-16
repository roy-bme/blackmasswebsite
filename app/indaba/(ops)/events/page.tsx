import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function EventsPage() {
  await requireModuleAccess("/indaba/events");

  return (
    <EmptyState
      eyebrow="Module"
      title="Events"
      description="Coming in Phase 11 — event calendar, attendance planning, and post-event debriefs."
    />
  );
}
