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
