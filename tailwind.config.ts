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
        zimx: {
          green: '#00875A',
          'green-deep': '#0F3424',
          gold: '#D4AF37',
          'gold-muted': '#B19631',
          black: '#1B1B1B',
          red: '#6A0F07',
          offwhite: '#F5F5F5',
        },
        sector: {
          wholesale: '#378ADD',
          fmcg: '#1D9E75',
          distribution: '#BA7517',
          manufacturing: '#E24B4A',
          agriculture: '#7F77DD',
          fuel: '#D4537E',
          hardware: '#888780',
          contact: '#D85A30',
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
