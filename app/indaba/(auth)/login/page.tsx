import Container from "@/components/Container";

export default function LoginPage() {
  return (
    <section className="pt-32 md:pt-40 pb-24">
      <Container>
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          INDABA / SIGN IN
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[48px] md:text-[72px]">
          SIGN IN
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">
          Supabase authentication lands in Phase 2.
        </p>
      </Container>
    </section>
  );
}
