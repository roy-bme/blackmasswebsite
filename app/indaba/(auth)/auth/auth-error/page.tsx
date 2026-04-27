import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";
import {
  errorMessageForToken,
  resolveAuthErrorToken,
} from "@/lib/ops/auth-error";

type AuthErrorPageProps = {
  searchParams: { reason?: string };
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const token = resolveAuthErrorToken(searchParams.reason);
  const message = errorMessageForToken(token);

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      <header className="flex h-14 items-center border-b border-line-10 px-6">
        <IndabaLogo size={18} />
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Eyebrow className="text-status-bad">auth error · 401</Eyebrow>
          <h1 className="mt-3 text-[28px] font-light leading-tight tracking-tight md:text-[36px]">
            can&apos;t sign you in.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-fg-mute">
            {message}
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <Button href="/login" variant="primary" fullWidth>
              Try again
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
