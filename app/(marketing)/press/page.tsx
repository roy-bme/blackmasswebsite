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

const pressItems = [
  {
    publication: "TechBullion",
    headline: "A New Player in African Fintech Is Rising — And He's Zimbabwean",
    href: "https://techbullion.com/a-new-player-in-african-fintech-is-rising-and-hes-zimbabwean/",
  },
  {
    publication: "TechBullion",
    headline: "From Great Zimbabwe to the Digital Age: The Return of Emps Roy",
    href: "https://techbullion.com/from-great-zimbabwe-to-the-digital-age-the-return-of-emps-roy/",
  },
  {
    publication: "Digital Journal",
    headline: "ZimX Finance to Represent Zimbabwe at Web Summit Lisbon 2025",
    href: "https://www.digitaljournal.com/pr/news/indnewswire/zimx-finance-represent-zimbabwe-web-183011404.html",
  },
  {
    publication: "Digital Journal",
    headline: "Emperor Roy Mupoto Honoured with Dual Awards at UK-Zimbabwe Business Expo 2025",
    href: "https://www.digitaljournal.com/pr/news/indnewswire/emperor-roy-mupoto-honoured-dual-1568435384.html",
  },
  {
    publication: "IPS News",
    headline: "ZimX Finance Heads to Web Summit Alpha",
    href: "https://ipsnews.net/business/2025/10/06/zimx-finance-heads-to-web-summit-alpha-bridging-diaspora-capital-and-digital-infrastructure/",
  },
  {
    publication: "OpenPR",
    headline: "ZimX Finance Launches ZiRA, a Purpose-Built AI Assistant for Zimbabweans",
    href: "https://www.openpr.com/news/4408297/zimx-finance-launches-zira-a-purpose-built-ai-assistant",
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
