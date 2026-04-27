import { redirect } from "next/navigation";

import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set new password",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ResetPasswordPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reaching this page directly without going through the email link won't
  // have a session — bounce to the canonical "link invalid" surface.
  if (!user) {
    redirect("/auth/auth-error?reason=reset_link_invalid");
  }

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      <header className="flex h-14 items-center border-b border-line-10 px-6">
        <IndabaLogo size={18} />
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Eyebrow gold>indaba / reset</Eyebrow>
          <h1 className="mt-3 text-[32px] font-light leading-tight tracking-tight md:text-[40px]">
            set a new password.
          </h1>
          <p className="mt-3 text-[13px] text-fg-mute">
            Resetting password for {user.email}.
          </p>

          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
}
