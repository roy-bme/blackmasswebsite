import IntrosClient from "./IntrosClient";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Introduction } from "@/types/ops";

export const dynamic = "force-dynamic";

type IntrosPageProps = {
  searchParams: { id?: string };
};

export default async function IntrosPage({ searchParams }: IntrosPageProps) {
  const user = await requireModuleAccess("/indaba/intros");
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("introductions")
    .select("*")
    .order("date_created", { ascending: false });

  const intros = (data ?? []) as Introduction[];

  return <IntrosClient intros={intros} isAdmin={user.role === "admin"} selectedId={searchParams.id} />;
}
