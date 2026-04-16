"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Dialog from "@/components/ops/ui/Dialog";
import Pill from "@/components/ops/ui/Pill";
import Tabs from "@/components/ops/ui/Tabs";
import { getSectorTheme } from "@/lib/ops/sector-colors";
import type { UserRole } from "@/types/ops";

import ActivityTab from "./tabs/ActivityTab";
import ContactsTab from "./tabs/ContactsTab";
import OverviewTab from "./tabs/OverviewTab";
import SupplyChainTab from "./tabs/SupplyChainTab";
import type {
  DirectoryBusiness,
  DirectoryZone,
} from "./types";

type BusinessDetailDialogProps = {
  business: DirectoryBusiness | null;
  zones: DirectoryZone[];
  allBusinesses: DirectoryBusiness[];
  canEdit: boolean;
  canSeeContacts: boolean;
  currentUserId: string;
  currentUserRole: UserRole;
  onClose: () => void;
};

export default function BusinessDetailDialog({
  business,
  zones,
  allBusinesses,
  canEdit,
  canSeeContacts,
  currentUserId,
  currentUserRole,
  onClose,
}: BusinessDetailDialogProps) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  function handleMutated() {
    router.refresh();
  }

  if (!business) {
    return (
      <Dialog
        open={false}
        onClose={onClose}
        size="xl"
        ariaLabel="Business detail"
      >
        <div />
      </Dialog>
    );
  }

  const sectorTheme = getSectorTheme(business.sector);

  return (
    <Dialog
      open={Boolean(business)}
      onClose={onClose}
      size="xl"
      ariaLabel={`${business.name} detail`}
    >
      <Dialog.Header>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog.Title className="truncate">{business.name}</Dialog.Title>
            {business.launch_6 ? (
              <Pill tone="warning" size="sm">
                Launch 6
              </Pill>
            ) : null}
            <Pill sector={sectorTheme.key} size="sm">
              {sectorTheme.label}
            </Pill>
          </div>
          {business.zone_name ? (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              {business.zone_name}
            </p>
          ) : null}
        </div>
        <Dialog.CloseButton onClose={onClose} />
      </Dialog.Header>
      <Dialog.Body className="space-y-4">
        <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            {canSeeContacts ? (
              <Tabs.Tab value="contacts">Contacts</Tabs.Tab>
            ) : null}
            <Tabs.Tab value="supply">Supply chain</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <OverviewTab
              business={business}
              zones={zones}
              canEdit={canEdit}
              onMutated={handleMutated}
            />
          </Tabs.Panel>

          {canSeeContacts ? (
            <Tabs.Panel value="contacts">
              <ContactsTab
                businessId={business.id}
                canEdit={canEdit}
                currentUserId={currentUserId}
                onMutated={handleMutated}
              />
            </Tabs.Panel>
          ) : null}

          <Tabs.Panel value="supply">
            <SupplyChainTab
              business={business}
              allBusinesses={allBusinesses}
              canEdit={canEdit}
              currentUserId={currentUserId}
              onMutated={handleMutated}
            />
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <ActivityTab
              businessId={business.id}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onMutated={handleMutated}
            />
          </Tabs.Panel>
        </Tabs>
      </Dialog.Body>
    </Dialog>
  );
}
