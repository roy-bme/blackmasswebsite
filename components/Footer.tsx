import Link from "next/link";

const socials = [
  { label: "X", href: "https://x.com/Roy_BME" },
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "https://instagram.com/Roy_BME" },
];

export default function Footer() {
  return (
    <footer
      className="bg-ink border-t"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="px-6 md:px-10 lg:px-12 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="flex flex-col gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blackmass.png"
              alt="Blackmass Enterprises"
              className="h-20 w-auto"
              loading="lazy"
            />
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-white">
                © 2026 Blackmass Enterprises Ltd. All rights reserved.
              </p>
              <p className="text-[12px] text-white/50">
                UK Company Registration: 16124799
              </p>
              <p className="text-[12px] text-white/50">
                Milton Keynes, United Kingdom
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex flex-wrap items-center gap-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-white transition-colors hover:text-white/50"
                >
                  {s.label}
                </a>
              ))}
              <a
                href="https://empsroy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-white transition-colors hover:text-white/50"
              >
                empsroy.com
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-[12px] text-white/50">
              <Link
                href="/about"
                className="transition-colors hover:text-white/30"
              >
                About
              </Link>
              <Link
                href="/press"
                className="transition-colors hover:text-white/30"
              >
                Press
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-white/30"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
