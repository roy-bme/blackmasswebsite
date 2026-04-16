import EmptyState from "@/components/ops/ui/EmptyState";
import { requireModuleAccess } from "@/lib/ops/auth";

export default async function DirectoryPage() {
  await requireModuleAccess("/indaba/directory");

  return (
    <EmptyState
      eyebrow="Module"
      title="Directory"
      description="Coming in Phase 8 — searchable business directory with contacts, stage, and sector filters."
    />
  );
}
