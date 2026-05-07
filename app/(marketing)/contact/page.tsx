import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Blackmass Enterprises Ltd for partnerships, investment, press, or general enquiries.",
  openGraph: {
    title: "Blackmass Enterprises — Contact",
    description:
      "Contact Blackmass Enterprises Ltd for partnerships, investment, press, or general enquiries.",
    url: "https://blackmass.co.uk/contact",
  },
  alternates: { canonical: "/contact" },
};

const socials = [
  { label: "X", handle: "@Roy_BME", href: "https://x.com/Roy_BME" },
  { label: "LinkedIn", handle: "Emperor Roy", href: "https://www.linkedin.com/in/emperor-roy/" },
  {
    label: "Instagram",
    handle: "@Roy_BME",
    href: "https://instagram.com/Roy_BME",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* PAGE HEADING */}
      <section className="pt-32 md:pt-40 pb-10 md:pb-14">
        <Container>
          <h1 className="font-mono font-light leading-[1.1] text-white text-[48px] md:text-[64px] lg:text-[72px]">
            CONTACT
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] text-white/70">
            For partnerships, investment, press, or general enquiries.
          </p>
        </Container>
      </section>

      {/* CONTACT DETAILS */}
      <section
        className="py-10 md:py-16 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">Direct</h2>
            </div>
            <div className="lg:col-span-8">
              <dl className="flex flex-col">
                <div
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 py-5 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <dt className="font-mono text-[12px] uppercase tracking-[1px] text-white/50 md:w-48">
                    EMAIL
                  </dt>
                  <dd>
                    <a
                      href="mailto:hello@zimx.finance"
                      className="text-[16px] text-white transition-colors hover:text-white/50"
                    >
                      hello@zimx.finance
                    </a>
                  </dd>
                </div>

                <div
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 py-5 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <dt className="font-mono text-[12px] uppercase tracking-[1px] text-white/50 md:w-48">
                    REGISTERED OFFICE
                  </dt>
                  <dd className="text-[16px] text-white/70">
                    Milton Keynes, United Kingdom
                  </dd>
                </div>

                <div
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 py-5 border-t border-b"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <dt className="font-mono text-[12px] uppercase tracking-[1px] text-white/50 md:w-48">
                    COMPANY REG.
                  </dt>
                  <dd className="text-[16px] text-white/70">16124799</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* SOCIAL */}
      <section
        className="py-10 md:py-16 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-[30px] leading-tight text-white">Social</h2>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ink p-6 flex flex-col gap-2 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
                      {s.label}
                    </span>
                    <span className="text-[16px] text-white">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* INVESTMENT */}
      <section
        className="py-10 md:py-16 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Container>
          <p className="max-w-3xl text-[14px] text-white/70 leading-relaxed">
            For investment enquiries relating to ZimX Finance, please contact
            Emperor Roy directly via{" "}
            <a
              href="mailto:hello@zimx.finance"
              className="text-white transition-colors hover:text-white/50"
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
