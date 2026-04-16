"use client";

import Tabs from "@/components/ops/ui/Tabs";

export type EventsTab = "upcoming" | "past";

type EventTabsProps = {
  value: EventsTab;
  onChange: (next: EventsTab) => void;
  upcomingCount: number;
  pastCount: number;
  children: React.ReactNode;
};

export default function EventTabs({
  value,
  onChange,
  upcomingCount,
  pastCount,
  children,
}: EventTabsProps) {
  return (
    <Tabs
      value={value}
      defaultValue={value}
      onValueChange={(v) => onChange(v as EventsTab)}
    >
      <Tabs.List>
        <Tabs.Tab value="upcoming">Upcoming ({upcomingCount})</Tabs.Tab>
        <Tabs.Tab value="past">Past ({pastCount})</Tabs.Tab>
      </Tabs.List>
      {children}
    </Tabs>
  );
}
