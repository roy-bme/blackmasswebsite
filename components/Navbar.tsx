"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/#ventures", label: "Ventures" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-ink transition-colors ${
        scrolled ? "backdrop-blur supports-[backdrop-filter]:bg-ink/80" : ""
      }`}
    >
      <div
        className="flex items-center justify-between px-6 md:px-10 lg:px-12 h-16 border-b"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Link
          href="/"
          className="font-mono text-[14px] uppercase tracking-[1.4px] text-white transition-opacity hover:opacity-50"
          onClick={() => setOpen(false)}
        >
          BLACKMASS
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] text-white transition-colors hover:text-white/50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="font-mono text-[14px] uppercase tracking-[1.4px] bg-white text-ink px-6 py-3 transition-colors hover:bg-white/90"
          >
            GET IN TOUCH
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden text-white w-8 h-8 flex items-center justify-center"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span className="relative block w-6 h-4">
            <span
              className={`absolute left-0 top-0 block w-6 h-[1px] bg-white transition-transform ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] block w-6 h-[1px] bg-white transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] block w-6 h-[1px] bg-white transition-transform ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ink border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <nav className="flex flex-col px-6 py-6 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[14px] text-white transition-colors hover:text-white/50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="font-mono text-[14px] uppercase tracking-[1.4px] bg-white text-ink px-6 py-3 text-center transition-colors hover:bg-white/90"
            >
              GET IN TOUCH
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
