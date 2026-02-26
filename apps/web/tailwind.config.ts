import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: "var(--border-default)",
        },
        bg: {
          page: "var(--bg-page)",
          surface: "var(--bg-surface)",
          "surface-raised": "var(--bg-surface-raised)",
          muted: "var(--bg-muted)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          text: "var(--accent-text)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        // Legacy compat (don't break existing brand usage yet)
        brand: "var(--accent-primary)",
        surface: "var(--bg-surface)",
        background: "var(--bg-page)",
        foreground: "var(--text-primary)",
      },
      animation: {
        "border-beam": "border-beam 4s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        "shimmer": {
          "from": {
            "backgroundPosition": "0 0",
          },
          "to": {
            "backgroundPosition": "-200% 0",
          },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
      },
      boxShadow: {
        "glow-violet": "0 0 20px -5px rgba(139, 92, 246, 0.3)",
        "glow-blue": "0 0 20px -5px rgba(59, 130, 246, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
