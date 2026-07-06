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
        // Luminous accents — Adventum brand blue + teal on dark
        // (token name "bio" retained across the codebase; now the brand teal)
        bio: {
          DEFAULT: "#1fc4dd",
          dim: "#178ba3",
          faint: "rgba(31, 196, 221, 0.12)",
        },
        pulse: {
          DEFAULT: "#4d9bf0",
          dim: "#2f6fb5",
          faint: "rgba(77, 155, 240, 0.12)",
        },
        // Brand royal blue (logo wordmark / mark)
        royal: {
          DEFAULT: "#2e6db4",
          deep: "#1b4f8a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
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
