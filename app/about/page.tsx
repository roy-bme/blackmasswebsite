import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Blackmass Enterprises Ltd is a British-Zimbabwean holding company building ventures across fintech, digital assets, AI, music IP, and live entertainment.",
  openGraph: {
    title: "Blackmass Enterprises — About",
    description:
      "Blackmass Enterprises Ltd is a British-Zimbabwean holding company building ventures across fintech, digital assets, AI, music IP, and live entertainment.",
    url: "https://blackmass.co.uk/about",
  },
  alternates: { canonical: "/about" },
};

const milestones = [
  { year: "2014", description: "Blackmass Events founded" },
  { year: "2020", description: "BME Management Ltd incorporated" },
  { year: "2024", description: "Blackmass Enterprises Ltd incorporated" },
  { year: "2025", description: "ZimX Finance launched" },
  { year: "2026", description: "ZiRA AI launched publicly" },
];

export default function AboutPage() {
  return (
    <>
      {/* PAGE HEADING */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-20">
        <Container>
          <h1 className="font-mono font-light leading-[1.1] text-white text-[48px] md:text-[64px] lg:text-[72px]">
            ABOUT
          </h1>
        </Container>
      </section>

      {/* COMPANY STORY */}
      <section
        className="py-16 md:py-20 lg:py-24 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">Story</h2>
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6 max-w-3xl">
              <p className="text-[16px] leading-relaxed text-white/70">
                Blackmass Enterprises Ltd was incorporated in 2024 as the
                holding structure for a portfolio that had been years in the
                making. The Blackmass brand started in 2014 with Blackmass
                Events, an entertainment company founded by Emperor Roy. In
                2020, BME Management Ltd was formed to manage LoveMusicLive and
                the growing portfolio. Blackmass Enterprises Ltd brought
                everything under one roof — fintech, artificial intelligence,
                music technology, and live entertainment — as a single holding
                company.
              </p>
              <p className="text-[16px] leading-relaxed text-white/70">
                From the financial infrastructure connecting the UK and
                Zimbabwe, to an AI assistant serving Zimbabweans worldwide, to
                technology protecting independent musicians&apos; rights — every
                venture in the Blackmass portfolio exists to build systems that
                didn&apos;t exist before.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* LEADERSHIP */}
      <section
        className="py-16 md:py-20 lg:py-24 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">
                Leadership
              </h2>
            </div>
            <div className="lg:col-span-8">
              <div
                className="bg-white/[0.03] border p-6 md:p-8 flex flex-col md:flex-row gap-8 transition-colors hover:border-white/20"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-full md:w-48 aspect-square border flex items-center justify-center shrink-0"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  aria-label="Photo of Emperor Roy placeholder"
                >
                  <span className="font-mono text-[12px] uppercase tracking-[1px] text-white/30">
                    PHOTO
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[22px] text-white leading-tight">
                      Emperor Roy
                    </h3>
                    <p className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
                      FOUNDER &amp; CEO
                    </p>
                  </div>
                  <p className="text-[16px] leading-relaxed text-white/70">
                    British-Zimbabwean entrepreneur. Builder of ZimX Finance,
                    ZiRA, and the Blackmass ecosystem.
                  </p>
                  <div>
                    <Button href="https://empsroy.com" variant="ghost">
                      FULL BIO
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* MILESTONES */}
      <section
        className="py-16 md:py-20 lg:py-24 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">
                Milestones
              </h2>
            </div>
            <div className="lg:col-span-8">
              <ol className="relative">
                {milestones.map((m, idx) => (
                  <li
                    key={m.year}
                    className="relative pl-8 pb-10 last:pb-0 border-l"
                    style={{
                      borderColor: "rgba(255,255,255,0.1)",
                      marginLeft: "6px",
                    }}
                  >
                    <span
                      className="absolute left-0 top-[6px] w-[9px] h-[9px] bg-white -translate-x-1/2"
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-2">
                      <span className="font-mono font-light text-[24px] leading-none text-white">
                        {m.year}
                      </span>
                      <span className="text-[14px] text-white/70">
                        {m.description}
                      </span>
                    </div>
                    {idx === milestones.length - 1 ? null : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
