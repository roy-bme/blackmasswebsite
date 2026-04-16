import type { Metadata } from "next";
import Container from "@/components/Container";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Press",
  description:
    "Press coverage and features for Blackmass Enterprises Ltd across global media.",
  openGraph: {
    title: "Blackmass Enterprises — Press",
    description:
      "Press coverage and features for Blackmass Enterprises Ltd across global media.",
    url: "https://blackmass.co.uk/press",
  },
  alternates: { canonical: "/press" },
};

// TODO: Replace placeholder links once final press URLs are confirmed.
const pressItems = [
  {
    publication: "AP News",
    headline: "ZimX Finance coverage",
    href: "#", // TODO: final AP News link
  },
  {
    publication: "TechBullion",
    headline: "Feature article",
    href: "#", // TODO: final TechBullion link
  },
  {
    publication: "Yahoo Finance",
    headline: "Syndicated coverage",
    href: "#", // TODO: final Yahoo Finance link
  },
  {
    publication: "Business Insider Africa",
    headline: "Feature",
    href: "#", // TODO: final Business Insider Africa link
  },
  {
    publication: "Benzinga",
    headline: "Coverage",
    href: "#", // TODO: final Benzinga link
  },
  {
    publication: "Web Summit Lisbon 2025",
    headline: "Represented Zimbabwe",
    href: "#", // TODO: final Web Summit link
  },
];

export default function PressPage() {
  return (
    <>
      {/* PAGE HEADING */}
      <section className="pt-32 md:pt-40 pb-10 md:pb-14">
        <Container>
          <h1 className="font-mono font-light leading-[1.1] text-white text-[48px] md:text-[64px] lg:text-[72px]">
            PRESS
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] text-white/70">
            Coverage and features across global media.
          </p>
        </Container>
      </section>

      {/* PRESS LIST */}
      <section
        className="py-10 md:py-16 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <ul className="flex flex-col gap-px bg-white/10">
            {pressItems.map((item) => (
              <li
                key={item.publication}
                className="bg-ink flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-[22px] text-white leading-tight">
                    {item.publication}
                  </h2>
                  <p className="text-[14px] text-white/70">{item.headline}</p>
                </div>
                <div>
                  <Button href={item.href} variant="ghost" external>
                    READ
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-[14px] text-white/50">
            For press enquiries, contact{" "}
            <a
              href="mailto:hello@zimx.finance"
              className="text-white/70 transition-colors hover:text-white/40"
            >
              hello@zimx.finance
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
