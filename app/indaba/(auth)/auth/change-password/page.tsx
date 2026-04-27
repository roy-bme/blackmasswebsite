import { redirect } from "next/navigation";

import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import ChangePasswordRequiredForm from "./ChangePasswordRequiredForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Change password",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Forced password-change surface.
 *
 * Reachable in two ways: directly (signed-in user wanting a fresh prompt),
 * or via redirect from the (ops) layout when the auth user has
 * `password_change_required` set on their metadata. There's intentionally
 * no "skip" or "remind me later" — the user has to set a new password
 * before any (ops) page will render.
 */
export default async function ForcedChangePasswordPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      <header className="flex h-14 items-center border-b border-line-10 px-6">
        <IndabaLogo size={18} />
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Eyebrow gold>indaba / security</Eyebrow>
          <h1 className="mt-3 text-[32px] font-light leading-tight tracking-tight md:text-[40px]">
            set a new password.
          </h1>
          <p className="mt-3 text-[13px] text-fg-mute">
            An admin requires you to choose a new password before continuing
            into the portal.
          </p>

          <ChangePasswordRequiredForm />

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
            Signed in as {user.email}
          </p>
        </div>
      </main>
    </div>
  );
}
