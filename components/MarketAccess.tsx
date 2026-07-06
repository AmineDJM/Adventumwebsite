"use client";

import { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import { useI18n } from "@/components/providers/I18nProvider";
import { EASE, VIEWPORT, fadeUp, lineGrow, stagger } from "@/lib/anim";

/* ------------------------------------------------------------------ */
/*  Market Access — one monolithic console surface for the hospital   */
/*  & tender channel. Four modules separated by hairlines, a quiet    */
/*  OS header bar and a near-invisible scan-line sweep.               */
/* ------------------------------------------------------------------ */

type ConsoleModule = {
  tagKey: string;
  titleKey: string;
  bodyKey: string;
  icon: ReactNode;
};

const ICON_CLASS = "h-5 w-5";

const MODULES: ConsoleModule[] = [
  {
    tagKey: "market.card1_tag",
    titleKey: "market.card1_title",
    bodyKey: "market.card1_body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M5 20.5V5.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v15M3 20.5h18M12 8v5m-2.5-2.5h5M9.5 20.5v-3.5h5v3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tagKey: "market.card2_tag",
    titleKey: "market.card2_title",
    bodyKey: "market.card2_body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M6.5 3.5h8l3 3v14h-11v-17zM14.5 3.5V7h3M9.5 11.5h5M9.5 15h3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tagKey: "market.card3_tag",
    titleKey: "market.card3_title",
    bodyKey: "market.card3_body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M12 3.5v17M4.6 7.75l14.8 8.5M19.4 7.75l-14.8 8.5M12 3.5l-2 2m2-2l2 2M12 20.5l-2-2m2 2l2-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tagKey: "market.card4_tag",
    titleKey: "market.card4_title",
    bodyKey: "market.card4_body",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M12 3.5l6.5 2.6v5.1c0 4.3-2.8 7.3-6.5 9.3-3.7-2-6.5-5-6.5-9.3V6.1L12 3.5zM9.25 11.75l2 2 3.5-3.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/* Console panel reveals itself, then staggers its own children. */
const consoleReveal: Variants = {
  hidden: { opacity: 0, y: 44 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.1,
      ease: EASE,
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export default function MarketAccess() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Gentle parallax on the ambient glows only — the panel itself is
      // animated by framer-motion and must keep its own transform.
      gsap.fromTo(
        glowRef.current,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="market-access"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* faint blueprint grid patch behind the console */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[min(90rem,130%)] -translate-x-1/2 -translate-y-1/2 bg-grid-faint"
        style={{
          maskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, black 0%, transparent 72%)",
        }}
      />

      {/* ambient accent glows — parallaxed by GSAP */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-20 right-[8%] h-96 w-96 rounded-full bg-pulse/5 blur-3xl" />
        <div className="absolute -bottom-24 left-[4%] h-80 w-80 rounded-full bg-bio/5 blur-3xl" />
      </div>

      <div className="shell relative">
        <SectionHeading
          eyebrow={t("market.eyebrow")}
          title={t("market.title")}
          highlight={["Hospital"]}
          sub={t("market.sub")}
        />

        {/* ---- the console ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={consoleReveal}
          className="relative mt-16 overflow-hidden rounded-3xl glass-strong card-shadow md:mt-24"
        >
          {/* top-edge light */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-surface/25 to-transparent"
          />

          {/* soft scan-line sweep */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute inset-x-0 h-full animate-scan-y bg-gradient-to-b from-transparent via-pulse/[0.04] to-transparent" />
          </div>

          {/* console header bar */}
          <motion.div
            variants={fadeUp}
            className="relative flex items-center justify-between px-8 py-5 md:px-10"
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted">
              {t("market.console_os")}{" "}
              <span className="text-frost/25">·</span>{" "}
              {t("market.console_channel")}
            </p>
            <span aria-hidden className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-bio/80 animate-pulse-soft" />
              <span className="h-1.5 w-1.5 rounded-full bg-pulse/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-silver/40" />
            </span>
          </motion.div>

          <div aria-hidden className="hairline" />

          {/* 2x2 module grid, separated by hairlines */}
          <motion.div variants={stagger(0.1)} className="grid lg:grid-cols-2">
            {MODULES.map((mod, i) => (
              <motion.article
                key={mod.titleKey}
                variants={fadeUp}
                className="group relative p-8 transition-colors duration-500 ease-premium hover:bg-surface/[0.02] md:p-10 lg:p-12"
              >
                {/* horizontal hairline above every module except the first
                    (on lg only above the second row) */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 hairline ${
                      i === 1 ? "lg:hidden" : ""
                    }`}
                  />
                )}
                {/* vertical hairline on the right column, lg only */}
                {i % 2 === 1 && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-surface/10 to-transparent lg:block"
                  />
                )}

                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline/[0.08] bg-surface/[0.03] text-silver transition-colors duration-500 ease-premium group-hover:border-pulse/30 group-hover:text-pulse">
                    {mod.icon}
                  </span>
                  <p className="text-right font-mono text-[0.6rem] uppercase tracking-[0.28em] text-muted">
                    {t(mod.tagKey)}
                  </p>
                </div>

                <h3 className="mt-7 font-display text-xl font-medium text-frost md:text-2xl">
                  {t(mod.titleKey)}
                </h3>

                <motion.span
                  aria-hidden
                  variants={lineGrow}
                  className="mt-4 block h-px w-full max-w-[9rem] origin-left bg-gradient-to-r from-pulse/50 to-transparent"
                />

                <p className="mt-4 max-w-md text-sm leading-relaxed text-silver">
                  {t(mod.bodyKey)}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
