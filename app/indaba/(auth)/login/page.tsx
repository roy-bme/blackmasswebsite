import Container from "@/components/Container";
import Logo from "@/components/ops/Logo";

import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: { next?: string };
};

// Only accept relative, single-segment-safe `next` values so a malicious link
// can't redirect post-auth to an external host.
function sanitiseNext(next: string | undefined): string | undefined {
  if (!next) return undefined;
  if (!next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = sanitiseNext(searchParams.next);

  return (
    <section className="pt-32 md:pt-40 pb-24">
      <Container>
        <Logo size="lg" variant="light" className="mb-10" />
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          INDABA / SIGN IN
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[48px] md:text-[72px]">
          SIGN IN
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">
          Enter your Blackmass email address. We&apos;ll send a magic link that signs
          you in for this session — no password required.
        </p>

        <LoginForm next={next} />
      </Container>
    </section>
  );
}
