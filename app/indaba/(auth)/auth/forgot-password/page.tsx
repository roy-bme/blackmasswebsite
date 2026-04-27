import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";

import ForgotPasswordForm from "./ForgotPasswordForm";

type ForgotPasswordPageProps = {
  searchParams: { error?: string; sent?: string };
};

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false, nocache: true },
};

export default function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const sent = searchParams.sent === "1";
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      <header className="flex h-14 items-center border-b border-line-10 px-6">
        <IndabaLogo size={18} />
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Eyebrow gold>indaba / reset</Eyebrow>
          <h1 className="mt-3 text-[32px] font-light leading-tight tracking-tight md:text-[40px]">
            forgot your password?
          </h1>

          {sent ? (
            <>
              <p className="mt-4 text-[14px] leading-relaxed text-fg-mute">
                If that email is registered, a reset link is on its way. The
                link will expire shortly — check your inbox.
              </p>
              <div className="mt-8">
                <Button href="/login" variant="ghost" fullWidth>
                  Back to sign in
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-[13px] text-fg-mute">
                Enter your email and we&apos;ll send you a link to set a new
                password.
              </p>
              <ForgotPasswordForm error={error} />
              <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                <a className="text-zimx-gold/80 hover:text-white" href="/login">
                  ← Back to sign in
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
