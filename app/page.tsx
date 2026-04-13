import Container from "@/components/Container";
import Button from "@/components/Button";
import VentureCard from "@/components/VentureCard";
import { ventures } from "@/lib/ventures";

const stats = [
  { value: "5", label: "Active Ventures" },
  { value: "12+", label: "ARIPO Jurisdictions" },
  { value: "2024", label: "Established" },
  { value: "MK, UK", label: "Headquarters" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32 lg:pb-40">
        <Container>
          <h1 className="font-mono font-light leading-[1.0] text-white text-[64px] sm:text-[96px] md:text-[160px] lg:text-[220px] xl:text-[280px] 2xl:text-[320px] break-all">
            BLACKMASS
          </h1>
          <div className="mt-10 md:mt-16 max-w-3xl flex flex-col gap-4">
            <p className="text-[16px] md:text-[18px] text-white/70 leading-relaxed">
              Building infrastructure. Creating value. Connecting worlds.
            </p>
            <p className="text-[14px] md:text-[16px] text-white/50 leading-relaxed">
              A British-Zimbabwean multi-venture holding company operating
              across fintech, digital assets, artificial intelligence, music IP
              protection, and live entertainment.
            </p>
          </div>
          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button href="/#ventures" variant="primary">
              EXPLORE VENTURES
            </Button>
            <Button href="/contact" variant="ghost">
              GET IN TOUCH
            </Button>
          </div>
        </Container>
      </section>

      {/* VENTURES */}
      <section
        id="ventures"
        className="py-16 md:py-24 lg:py-32 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <h2 className="text-[30px] leading-tight text-white">Portfolio</h2>
          <p className="mt-3 max-w-xl text-[14px] text-white/50">
            Five ventures, operating across four continents.
          </p>

          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {ventures.slice(0, 3).map((v) => (
              <VentureCard key={v.title} venture={v} />
            ))}
            {/* Bottom row — 2 centred on desktop */}
            <div className="hidden lg:block bg-ink" />
            {ventures.slice(3, 5).map((v) => (
              <VentureCard key={v.title} venture={v} />
            ))}
            <div className="hidden lg:block bg-ink" />
          </div>
        </Container>
      </section>

      {/* ABOUT */}
      <section
        className="py-16 md:py-24 lg:py-32 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">About</h2>
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6 max-w-3xl">
              <p className="text-[16px] leading-relaxed text-white/70">
                Blackmass Enterprises Ltd (UK Company Registration: 16124799) is
                a holding company founded by Emperor Roy. Headquartered in
                Milton Keynes, United Kingdom, we build and operate ventures
                that solve real problems — from cross-border payments to
                cultural AI, from music rights protection to live events.
              </p>
              <p className="text-[16px] leading-relaxed text-white/70">
                Our approach is compliance-first, infrastructure-focused, and
                built for permanence. Every venture in the portfolio is
                designed to create lasting value — not chase trends.
              </p>
              <div className="mt-4">
                <Button href="/about" variant="ghost">
                  LEARN MORE
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* STATS */}
      <section
        className="py-16 md:py-20 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col gap-2 px-4 md:px-6 py-6 ${
                  i > 0 ? "md:border-l" : ""
                } ${i === 1 ? "border-l md:border-l" : ""} ${
                  i === 2 ? "border-t md:border-t-0" : ""
                } ${i === 3 ? "border-l border-t md:border-t-0" : ""}`}
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <span className="font-mono font-light text-[36px] md:text-[48px] leading-none text-white">
                  {s.value}
                </span>
                <span className="text-[12px] text-white/70 uppercase tracking-[0.5px]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
