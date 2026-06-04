import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        content: "72rem",
        "content-wide": "80rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        heading: ["var(--font-manrope)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        bricolage: ["var(--font-manrope)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        "background-muted": "var(--background-muted)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        border: "var(--border)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        accent: "var(--primary)",
        "card-bg": "var(--card-bg)",
        "card-border": "var(--card-border)",
        "soft-white": "var(--foreground)",
        "near-black": "#1d1d1f",
        brand: {
          primary: "var(--brand-primary, #2f2a8a)",
          secondary: "var(--brand-secondary, #5e5ad7)",
          accent: "var(--brand-accent, #ff7a45)",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [typography],
};

export default config;
