import Link from "next/link";

import Container from "@/components/Container";

type AuthErrorPageProps = {
  searchParams: { reason?: string };
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  return (
    <section className="pt-32 md:pt-40 pb-24">
      <Container>
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          INDABA / SIGN IN
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[48px] md:text-[72px]">
          SIGN-IN FAILED
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">
          That magic link couldn&apos;t be used. It may have expired, already been
          consumed, or been sent to an address that isn&apos;t provisioned.
        </p>
        {searchParams.reason && (
          <p className="mt-4 max-w-xl font-mono text-[13px] text-white/50">
            Reason: {searchParams.reason}
          </p>
        )}
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
