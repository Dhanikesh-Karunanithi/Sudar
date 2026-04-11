import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          strong: "var(--primary-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          soft: "var(--accent-soft)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        destructive: "var(--destructive)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-heading)", "Manrope", "Inter", "Segoe UI", "Arial", "sans-serif"],
      },
      keyframes: {
        "sudar-logo-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.055)" },
          "70%": { transform: "scale(1.02)" },
        },
        "sudar-logo-drift": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-4px) scale(1.045)" },
        },
        "sudar-star-shimmer": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.78" },
        },
        "sudar-star-rim-glow": {
          "0%, 64%, 100%": { opacity: "0" },
          "70%": { opacity: "0.55" },
          "74%": { opacity: "0.08" },
          "79%": { opacity: "0.42" },
          "85%, 100%": { opacity: "0" },
        },
        "sudar-loader-glow": {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.9)" },
          "50%": { opacity: "0.7", transform: "scale(1.06)" },
        },
      },
      animation: {
        "sudar-logo-pulse": "sudar-logo-pulse 2.8s ease-in-out infinite",
        "sudar-logo-drift": "sudar-logo-drift 1.85s ease-in-out infinite",
        "sudar-star-shimmer": "sudar-star-shimmer 1.85s ease-in-out infinite",
        "sudar-star-rim-glow": "sudar-star-rim-glow 6.5s ease-in-out infinite",
        "sudar-loader-glow": "sudar-loader-glow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
