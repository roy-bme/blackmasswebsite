import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";
import { resolveAuthErrorToken } from "@/lib/ops/auth-error";
import { resolveFlash } from "@/lib/ops/flash";
import { safeNext, DEFAULT_NEXT } from "@/lib/ops/next-param";

import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: { next?: string; error?: string; flash?: string };
};

const SECTOR_PINS: Array<{
  x: number;
  y: number;
  color: string;
}> = [
  { x: 34, y: 42, color: "#BA7517" },
  { x: 58, y: 38, color: "#E24B4A" },
  { x: 64, y: 58, color: "#378ADD" },
  { x: 44, y: 66, color: "#1D9E75" },
  { x: 72, y: 46, color: "#7F77DD" },
  { x: 28, y: 62, color: "#D4537E" },
  { x: 50, y: 50, color: "#E6A83C" },
];

export default function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = safeNext(searchParams.next ?? null);
  const next = resolved === DEFAULT_NEXT ? undefined : resolved;
  const error = searchParams.error
    ? resolveAuthErrorToken(searchParams.error)
    : undefined;
  const flash = resolveFlash(searchParams.flash);

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      <header className="flex h-14 items-center border-b border-line-10 px-6">
        <IndabaLogo size={18} />
      </header>

      <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-10 md:px-16 md:py-16">
          <div className="w-full max-w-md">
            <Eyebrow gold>indaba / sign in</Eyebrow>
            <h1 className="mt-3 text-[40px] font-light leading-none tracking-tight md:text-[48px]">
              welcome back.
            </h1>
            <p className="mt-3 text-[13px] text-fg-mute">
              Sign in to the operations portal.
            </p>

            <LoginForm next={next} error={error} flash={flash} />

            <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
              Internal tool · access controlled by Blackmass admin
            </p>
          </div>
        </section>

        <section
          aria-hidden="true"
          className="indaba-map-placeholder relative hidden border-l border-line-10 md:block"
        >
          <div className="absolute inset-0 flex flex-col justify-between p-9">
            <Eyebrow gold>20.1574°S 28.5860°E</Eyebrow>
            <div>
              <IndabaLogo size={22} glyphOnly />
              <h2 className="mt-3 text-[32px] font-light leading-none tracking-tight">
                Bulawayo · ZW
              </h2>
            </div>
          </div>
          {SECTOR_PINS.map((pin, i) => (
            <span
              key={i}
              className="absolute h-2.5 w-2.5"
              style={{
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                background: pin.color,
                boxShadow: "0 0 0 2px rgba(20,22,26,0.6)",
              }}
            />
          ))}
        </section>
      </div>

      <footer className="px-6 pb-6 text-center md:hidden">
        <p className="font-mono text-[9px] uppercase tracking-eyebrow text-fg-dim">
          Blackmass Enterprises Ltd · v1.0
        </p>
      </footer>
    </div>
  );
}
