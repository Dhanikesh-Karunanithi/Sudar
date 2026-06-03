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
        shell: "var(--shell-bg)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          muted: "var(--accent-muted)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
          muted: "var(--success-muted)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
          muted: "var(--warning-muted)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        pill: "var(--radius-pill)",
        "card-lg": "var(--radius-lg)",
        "card-xl": "var(--radius-xl)",
        shell: "var(--radius-shell)",
        "chat-panel": "var(--radius-chat-panel)",
        "4xl": "var(--radius-4xl)",
        "5xl": "var(--radius-5xl)",
        "6xl": "var(--radius-6xl)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Manrope", "Inter", "Segoe UI", "Arial", "sans-serif"],
        /** Arabic, Indic, Cyrillic, Hebrew, Thai, etc. */
        "noto-intl": [
          "var(--font-noto-intl)",
          "var(--font-body)",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
        "noto-sc": ["var(--font-noto-sc)", "var(--font-body)", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        "noto-jp": ["var(--font-noto-jp)", "var(--font-body)", "Hiragino Sans", "Meiryo", "sans-serif"],
        "noto-kr": ["var(--font-noto-kr)", "var(--font-body)", "Malgun Gothic", "Apple SD Gothic Neo", "sans-serif"],
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
        "hibernation-sleep": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(3px) scale(0.98)" },
        },
        "hibernation-warning-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.88" },
        },
        "zzz-float": {
          "0%": { opacity: "0", transform: "translate(0, 0) scale(0.7)" },
          "15%": { opacity: "0.85", transform: "translate(2px, -6px) scale(0.9)" },
          "70%": { opacity: "0.5", transform: "translate(8px, -22px) scale(1)" },
          "100%": { opacity: "0", transform: "translate(14px, -36px) scale(1.05)" },
        },
        "hibernation-cave-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "sudar-logo-pulse": "sudar-logo-pulse 2.8s ease-in-out infinite",
        "sudar-logo-drift": "sudar-logo-drift 1.85s ease-in-out infinite",
        "sudar-star-shimmer": "sudar-star-shimmer 1.85s ease-in-out infinite",
        "sudar-star-rim-glow": "sudar-star-rim-glow 6.5s ease-in-out infinite",
        "sudar-loader-glow": "sudar-loader-glow 2.2s ease-in-out infinite",
        "hibernation-sleep": "hibernation-sleep 3.2s ease-in-out infinite",
        "hibernation-warning-pulse": "hibernation-warning-pulse 2.4s ease-in-out infinite",
        "zzz-float": "zzz-float 2.8s ease-out infinite",
        "hibernation-cave-glow": "hibernation-cave-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
