import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy alias — some marketing chrome still references `bg-ink`.
        // The new ops portal uses the full `ink.*` scale below.
        ink: {
          DEFAULT: "#1f2228",
          900: "#14161a",
          800: "#1a1d22",
          700: "#1f2228",
          600: "#262a31",
          500: "#2f343c",
          400: "#3a3f48",
          300: "#4a4f59",
        },
        line: {
          10: "rgba(255,255,255,0.08)",
          15: "rgba(255,255,255,0.12)",
          20: "rgba(255,255,255,0.18)",
          30: "rgba(255,255,255,0.28)",
        },
        fg: {
          DEFAULT: "#ffffff",
          mute: "rgba(255,255,255,0.62)",
          dim: "rgba(255,255,255,0.42)",
          faint: "rgba(255,255,255,0.24)",
        },
        status: {
          ok: "#4ec38a",
          warn: "#e6a83c",
          bad: "#e2614b",
          info: "#5aa8e6",
        },
        zimx: {
          green: "#00875A",
          "green-deep": "#0F3424",
          gold: "#D4AF37",
          "gold-muted": "#B19631",
          "gold-glow": "rgba(212,175,55,0.18)",
          black: "#1B1B1B",
          red: "#6A0F07",
          offwhite: "#F5F5F5",
        },
        // Sector accents — six categories per the indaba design tokens.
        // Names align with `--sec-*` CSS variables in globals.css and the
        // SectorKey union in `lib/ops/sector-colors.ts`.
        sector: {
          mining: "#BA7517",
          manufacturing: "#E24B4A",
          retail: "#378ADD",
          wholesale: "#378ADD",
          services: "#7F77DD",
          agriculture: "#1D9E75",
          fmcg: "#1D9E75",
          fuel: "#D4537E",
          // Legacy aliases retained so older marketing surfaces keep building.
          distribution: "#BA7517",
          hardware: "#888780",
          contact: "#D85A30",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Roboto Mono",
          "Menlo",
          "Monaco",
          "Liberation Mono",
          "DejaVu Sans Mono",
          "Courier New",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0px",
      },
      letterSpacing: {
        button: "1.4px",
        tag: "1px",
        eyebrow: "0.14em",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
