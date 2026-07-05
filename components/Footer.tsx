"use client";

import { motion } from "framer-motion";
import { EASE, VIEWPORT, fadeIn, stagger } from "@/lib/anim";
import { scrollToSection } from "@/components/providers/SmoothScroll";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Infectiology", href: "#infectiology" },
  { label: "Platform", href: "#platform" },
  { label: "Regulatory", href: "#regulatory" },
  { label: "Partnerships", href: "#partnerships" },
  { label: "Vision", href: "#vision" },
  { label: "Contact", href: "#contact" },
];

const FOCUS_AREAS = [
  "HIV / Antiretrovirals",
  "Hospital Infectious Diseases",
  "Public Health Therapeutics",
  "Strategic Supply Access",
];

const columnFade = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

const columnTitle =
  "font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted";

function FooterMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center">
      <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9" aria-hidden>
        <path
          d="M18 3l13 7.5v15L18 33 5 25.5v-15L18 3z"
          stroke="url(#footer-mark)"
          strokeWidth="1.4"
        />
        <circle cx="18" cy="18" r="3.2" fill="url(#footer-mark)" />
        <circle cx="18" cy="9.5" r="1.6" fill="#4cd7f6" opacity="0.9" />
        <circle cx="25.4" cy="22.3" r="1.6" fill="#3ee6a8" opacity="0.9" />
        <path
          d="M18 14.8v-3.7M20.8 19.6l3.2 1.9"
          stroke="#89a8bd"
          strokeWidth="0.9"
          opacity="0.8"
        />
        <defs>
          <linearGradient id="footer-mark" x1="5" y1="3" x2="31" y2="33">
            <stop stopColor="#3ee6a8" />
            <stop offset="1" stopColor="#4cd7f6" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function Footer() {
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06]">
      {/* faint blueprint grid, masked to the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-grid-faint opacity-50"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />
      {/* whisper of accent light behind the brand column */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-[10%] h-56 w-72 rounded-full bg-pulse/5 blur-3xl"
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={fadeIn}
        className="shell relative py-16 md:py-20"
      >
        {/* top grid */}
        <motion.div
          variants={stagger(0.1)}
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10"
        >
          {/* brand */}
          <motion.div variants={columnFade}>
            <div className="flex items-center gap-3">
              <FooterMark />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[1.05rem] font-semibold tracking-[0.18em] text-frost">
                  ADVENTUM
                </span>
                <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.5em] text-pulse/80">
                  Pharma
                </span>
              </span>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
              Advancing infectious disease care in Algeria through regulatory
              excellence and strategic partnerships.
            </p>
          </motion.div>

          {/* navigate */}
          <motion.nav variants={columnFade} aria-label="Footer navigation">
            <h3 className={columnTitle}>Navigate</h3>
            <ul className="mt-6 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={go(link.href)}
                    className="text-sm text-silver transition-colors duration-300 ease-premium hover:text-frost"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* focus */}
          <motion.div variants={columnFade}>
            <h3 className={columnTitle}>Focus</h3>
            <ul className="mt-6 space-y-3">
              {FOCUS_AREAS.map((area) => (
                <li
                  key={area}
                  className="flex items-center gap-2.5 text-sm text-silver"
                >
                  <span
                    aria-hidden
                    className="h-1 w-1 shrink-0 rounded-full bg-bio/60"
                  />
                  {area}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* contact */}
          <motion.div variants={columnFade}>
            <h3 className={columnTitle}>Contact</h3>
            <ul className="mt-6 space-y-3 text-sm text-silver">
              <li className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-muted"
                  aria-hidden
                >
                  <path
                    d="M8 14.5s4.5-3.9 4.5-7.5a4.5 4.5 0 10-9 0c0 3.6 4.5 7.5 4.5 7.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="8"
                    cy="7"
                    r="1.6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Algiers, Algeria
              </li>
              <li className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-muted"
                  aria-hidden
                >
                  <path
                    d="M5.5 7a2.5 2.5 0 113.4 2.34M10.5 9a2.5 2.5 0 11-3.4-2.34"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Partnerships &amp; Licensing
              </li>
            </ul>
            <button
              type="button"
              onClick={() => scrollToSection("#home")}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium tracking-wide text-silver transition-all duration-500 ease-premium hover:border-pulse/40 hover:text-frost focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse/60"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path
                  d="M8 13V3m0 0L4 7m4-4l4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to top
            </button>
          </motion.div>
        </motion.div>

        {/* divider */}
        <div className="hairline mt-14 md:mt-16" />

        {/* bottom row */}
        <div className="mt-8 flex flex-col flex-wrap items-start gap-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 Adventum Pharma. All rights reserved.</p>
          <p className="md:text-center">
            Product availability is subject to registration status in each
            market.
          </p>
          <p
            aria-hidden
            className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted/70"
          >
            ADVENTUM OS · v1.0
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
