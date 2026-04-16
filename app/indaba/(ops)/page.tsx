import { redirect } from "next/navigation";

import Container from "@/components/Container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function IndabaHomePage() {
  // Middleware already gates this route, but fetch the user here so we can
  // show who's signed in and surface a sign-out control until Phase 6 builds
  // out the real portal chrome.
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Defensive — middleware should have redirected already, but keep the
    // component honest in case it's rendered outside the middleware chain
    // (e.g. via a direct /indaba hit during dev).
    redirect("/login");
  }

  return (
    <section className="pt-32 md:pt-40 pb-24">
      <Container>
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          INDABA / PHASE 3
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[48px] md:text-[72px] lg:text-[96px]">
          INDABA
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">
          Blackmass internal operations portal. Auth is live; the dashboard
          lands in Phase 6.
        </p>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
            Signed in as <span className="text-white/80">{user.email}</span>
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center border border-white/40 px-5 py-2 font-mono text-[11px] uppercase tracking-[1.5px] text-white/80 transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Sign out
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
