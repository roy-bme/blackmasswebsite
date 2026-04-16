import EventsView from "@/components/ops/Events/EventsView";
import type {
  EventWithDebrief,
  UserLite,
} from "@/components/ops/Events/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event, EventDebrief, User } from "@/types/ops";

export default async function EventsPage() {
  const user = await requireModuleAccess("/indaba/events");
  const supabase = createSupabaseServerClient();

  const [eventsRes, debriefsRes, usersRes] = await Promise.all([
    supabase.from("events").select("*").order("date", { ascending: true }),
    supabase.from("event_debriefs").select("*"),
    supabase
      .from("users")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const events = (eventsRes.data ?? []) as Event[];
  const debriefs = (debriefsRes.data ?? []) as EventDebrief[];
  const users: UserLite[] = (
    (usersRes.data ?? []) as Pick<User, "id" | "name">[]
  ).map((u) => ({ id: u.id, name: u.name }));

  const debriefByEvent = new Map<string, EventDebrief>();
  for (const d of debriefs) {
    if (d.event_id) debriefByEvent.set(d.event_id, d);
  }

  const eventsWithDebriefs: EventWithDebrief[] = events.map((e) => ({
    ...e,
    debrief: debriefByEvent.get(e.id) ?? null,
  }));

  const canEdit = user.role === "admin" || user.role === "bd";

  return (
    <EventsView
      events={eventsWithDebriefs}
      users={users}
      canEdit={canEdit}
      currentUserId={user.id}
    />
  );
}
