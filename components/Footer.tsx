"use client";

import { motion } from "framer-motion";
import { EASE, VIEWPORT, fadeIn, stagger } from "@/lib/anim";
import { scrollToSection } from "@/components/providers/SmoothScroll";
import AdventumMark from "@/components/ui/AdventumMark";
import { useI18n } from "@/components/providers/I18nProvider";

const NAV_LINKS = [
  { labelKey: "footer.nav_home", href: "#home" },
  { labelKey: "footer.nav_infectiology", href: "#infectiology" },
  { labelKey: "footer.nav_platform", href: "#platform" },
  { labelKey: "footer.nav_regulatory", href: "#regulatory" },
  { labelKey: "footer.nav_partnerships", href: "#partnerships" },
  { labelKey: "footer.nav_vision", href: "#vision" },
  { labelKey: "footer.nav_contact", href: "#contact" },
];

const FOCUS_AREAS = [
  "footer.focus_hiv",
  "footer.focus_hospital",
  "footer.focus_public_health",
  "footer.focus_supply",
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
      <AdventumMark id="footer-mark" className="h-9 w-9" />
    </span>
  );
}

export default function Footer() {
  const { t } = useI18n();

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <footer className="relative overflow-hidden border-t border-hairline/[0.06]">
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
              {t("footer.brand_description")}
            </p>
          </motion.div>

          {/* navigate */}
          <motion.nav
            variants={columnFade}
            aria-label={t("footer.nav_aria_label")}
          >
            <h3 className={columnTitle}>{t("footer.nav_heading")}</h3>
            <ul className="mt-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={go(link.href)}
                    className="inline-block py-1.5 text-sm text-silver transition-colors duration-300 ease-premium hover:text-frost"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* focus */}
          <motion.div variants={columnFade}>
            <h3 className={columnTitle}>{t("footer.focus_heading")}</h3>
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
                  {t(area)}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* contact */}
          <motion.div variants={columnFade}>
            <h3 className={columnTitle}>{t("footer.contact_heading")}</h3>
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
                {t("footer.address")}
              </li>
              <li>
                <a
                  href="mailto:Info@adventumdz.com"
                  className="flex items-center gap-2.5 transition-colors duration-300 hover:text-frost"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-muted" aria-hidden>
                    <rect x="2" y="3.5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2.5 4.5L8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Info@adventumdz.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-muted" aria-hidden>
                  <path d="M3 2.5h2l1.3 3.2-1.3 1a7 7 0 003.3 3.3l1-1.3 3.2 1.3v2a1 1 0 01-1.1 1A10.5 10.5 0 013 3.6 1 1 0 013 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +213 (0)20 339 430
              </li>
            </ul>
            <button
              type="button"
              onClick={() => scrollToSection("#home")}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-hairline/10 px-4 py-2 text-xs font-medium tracking-wide text-silver transition-all duration-500 ease-premium hover:border-pulse/40 hover:text-frost focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse/60"
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
              {t("footer.back_to_top")}
            </button>
          </motion.div>
        </motion.div>

        {/* divider */}
        <div className="hairline mt-14 md:mt-16" />

        {/* bottom row */}
        <div className="mt-8 flex flex-col flex-wrap items-start gap-4 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>{t("footer.copyright")}</p>
          <p className="md:text-center">
            {t("footer.disclaimer")}
          </p>
          <p
            aria-hidden
            className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted/70"
          >
            {t("footer.os_version")}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
