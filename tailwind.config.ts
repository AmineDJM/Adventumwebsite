import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space / midnight scale — page backgrounds
        abyss: "#02050c",
        midnight: "#050b17",
        navy: "#0a1526",
        panel: "#0b1322",
        // Cold whites & silvers — typography
        frost: "#eaf2fb",
        silver: "#aebacd",
        muted: "#71809a",
        // Adventum brand palette — exact charter values.
        // bio = brand cyan (Pantone 3105 C); the luminous accent on dark.
        bio: {
          DEFAULT: "#68D2DF",
          dim: "#087084", // primary teal (Pantone 7714 C)
          faint: "rgba(104, 210, 223, 0.12)",
        },
        // pulse = brand blue (Pantone 2945 C), brightened for dark legibility.
        pulse: {
          DEFAULT: "#2f83d6",
          dim: "#0057B8",
          faint: "rgba(47, 131, 214, 0.12)",
        },
        // Brand primaries (logo wordmark / mark / CTAs)
        royal: {
          DEFAULT: "#0057B8", // Pantone 2945 C
          deep: "#004a9e",
        },
        teal: {
          DEFAULT: "#087084", // Pantone 7714 C — "bleu Adventum"
          cta: "#046F83", // charter web-CTA teal
        },
        // Secondary accent (Pantone 375 C) — used sparingly per charter
        lime: "#82C341",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Calibri", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Calibri", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": [
          "clamp(2.75rem, 6.5vw, 6rem)",
          { lineHeight: "1.02", letterSpacing: "-0.03em" },
        ],
        "display-lg": [
          "clamp(2.25rem, 4.5vw, 4.25rem)",
          { lineHeight: "1.06", letterSpacing: "-0.025em" },
        ],
        "display-md": [
          "clamp(1.75rem, 3.2vw, 3rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ],
      },
      maxWidth: {
        shell: "82rem",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "400": "400ms",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "drift-y": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scan-y": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 3.2s ease-in-out infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "drift-y": "drift-y 7s ease-in-out infinite",
        shimmer: "shimmer 5s linear infinite",
        "scan-y": "scan-y 6s linear infinite",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
