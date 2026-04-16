import Container from "@/components/Container";
import Button from "@/components/Button";

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center pt-32 md:pt-40 pb-24">
      <Container>
        <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
          ERROR 404
        </p>
        <h1 className="mt-6 font-mono font-light leading-[1.0] text-white text-[64px] md:text-[120px] lg:text-[160px]">
          NOT FOUND
        </h1>
        <p className="mt-8 max-w-xl text-[16px] text-white/70">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button href="/" variant="primary">
            RETURN HOME
          </Button>
          <Button href="/contact" variant="ghost">
            CONTACT US
          </Button>
        </div>
      </Container>
    </section>
  );
}
