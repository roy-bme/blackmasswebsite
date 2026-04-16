import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2228",
        // ZimX brand palette — consumed by the ops portal under /indaba.
        // Marketing pages still use the dark `ink` body, while ops pages
        // override the body background to `zimx-offwhite` via OpsShell.
        zimx: {
          ink: "#1f2228",
          charcoal: "#2a2d33",
          slate: "#3b3f47",
          mute: "#6b7280",
          line: "#e5e3dd",
          paper: "#ffffff",
          offwhite: "#f5f3ee",
          cream: "#faf8f3",
          gold: "#c9a55a",
          rust: "#a0552b",
          sage: "#7a8a6a",
        },
        // Sector accents — one per Blackmass venture sector. Used by
        // SectorPill, project cards, and the Logo accent rail.
        sector: {
          fintech: "#1f5fa6",
          ai: "#6d28d9",
          assets: "#c9a55a",
          music: "#be123c",
          entertainment: "#c2410c",
          ops: "#3b3f47",
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
      },
    },
  },
  plugins: [],
};

export default config;
