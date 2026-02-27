import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        panelMuted: "rgb(var(--color-panel-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        textMuted: "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        highlight: "rgb(var(--color-highlight) / <alpha-value>)"
      },
      boxShadow: {
        panel: "0 8px 24px rgba(0, 0, 0, 0.32)"
      },
      fontFamily: {
        sans: ["'Manrope'", "'IBM Plex Sans'", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: [typography]
};

export default config;
