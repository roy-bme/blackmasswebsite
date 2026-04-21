import Link from "next/link";

import Container from "@/components/Container";
import Logo from "@/components/ops/Logo";
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
    <section className="pt-32 md:pt-40 pb-24">
      <Container>
        <Logo size="lg" variant="light" className="mb-10" />
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          INDABA / SIGN IN
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[48px] md:text-[72px]">
          SIGN-IN FAILED
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">{message}</p>
        <Link
          href="/login"
          className="mt-10 inline-flex items-center border border-white/80 px-6 py-3 font-mono text-[12px] uppercase tracking-[1.5px] text-white transition-colors hover:bg-white hover:text-black"
        >
          Try again
        </Link>
      </Container>
    </section>
  );
}
