import IntrosView from "@/components/ops/Intros/IntrosView";
import type { IntroBusinessOption } from "@/components/ops/Intros/types";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Introduction } from "@/types/ops";

export default async function IntrosPage() {
  const user = await requireModuleAccess("/indaba/intros");
  const supabase = createSupabaseServerClient();

  const [introsRes, businessesRes] = await Promise.all([
    supabase
      .from("introductions")
      .select("*")
      .order("date_created", { ascending: false }),
    supabase
      .from("businesses")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const introductions = (introsRes.data ?? []) as Introduction[];
  const businesses: IntroBusinessOption[] = (
    (businessesRes.data ?? []) as Pick<Business, "id" | "name">[]
  ).map((b) => ({ id: b.id, name: b.name }));

  const isAdmin = user.role === "admin";

  return (
    <IntrosView
      introductions={introductions}
      businesses={businesses}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  );
}
