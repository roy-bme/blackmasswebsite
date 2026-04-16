import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function FeedPage() {
  await requireModuleAccess("/indaba/feed");

  return (
    <EmptyState
      eyebrow="Module"
      title="Ops feed"
      description="Coming in Phase 12 — unified activity stream across ground ops, BD, and admin channels."
    />
  );
}
