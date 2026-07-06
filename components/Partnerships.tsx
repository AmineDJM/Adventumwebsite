"use client";

import { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { PrimaryButton, GhostButton } from "@/components/ui/Buttons";
import { EASE, VIEWPORT, fadeUp, lineGrow, stagger } from "@/lib/anim";
import { useI18n } from "@/components/providers/I18nProvider";

/* ------------------------------------------------------------------ */
/*  Partnerships — six structured collaboration models rendered as    */
/*  numbered protocol cards (P-01…P-06), an audience readout line and */
/*  a quiet, centered engagement CTA. Abstract "across borders"       */
/*  energy: link nodes, merging strands, ascending paths.             */
/* ------------------------------------------------------------------ */

type PartnershipModel = {
  code: string;
  titleKey: string;
  bodyKey: string;
  icon: ReactNode;
};

const ICON_CLASS = "h-5 w-5";

const AUDIENCES = [
  "partnerships.audience_manufacturers",
  "partnerships.audience_biotech",
  "partnerships.audience_suppliers",
  "partnerships.audience_licensing",
];

const MODELS: PartnershipModel[] = [
  {
    code: "P-01",
    titleKey: "partnerships.model_licensing_title",
    bodyKey: "partnerships.model_licensing_body",
    icon: (
      // link nodes
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <circle
          cx="7"
          cy="12"
          r="3.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="17"
          cy="12"
          r="3.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10.25 12h3.5M7 8.75v-3m10 12.5v-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    code: "P-02",
    titleKey: "partnerships.model_codev_title",
    bodyKey: "partnerships.model_codev_body",
    icon: (
      // twin helix merging
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M7.5 3.5c0 5.5 9 6.5 9 12 0 2.3-1.6 4.1-3.9 5M16.5 3.5c0 5.5-9 6.5-9 12 0 2.3 1.6 4.1 3.9 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8.75 7.5h6.5M8.75 16.5h6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    code: "P-03",
    titleKey: "partnerships.model_registration_title",
    bodyKey: "partnerships.model_registration_body",
    icon: (
      // shield-document
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M12 3.5l6.5 2.5v5.2c0 4.3-2.8 7.3-6.5 9.3-3.7-2-6.5-5-6.5-9.3V6L12 3.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 9.75h5M9.5 12.75h3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    code: "P-04",
    titleKey: "partnerships.model_tender_title",
    bodyKey: "partnerships.model_tender_body",
    icon: (
      // target rings
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle
          cx="12"
          cy="12"
          r="4.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="12"
          cy="12"
          r="1.1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    code: "P-05",
    titleKey: "partnerships.model_commercialization_title",
    bodyKey: "partnerships.model_commercialization_body",
    icon: (
      // institutional building
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M5.5 20.5v-13L12 4.5l6.5 3v13M3 20.5h18M10.5 20.5v-3.5h3v3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    code: "P-06",
    titleKey: "partnerships.model_market_dev_title",
    bodyKey: "partnerships.model_market_dev_body",
    icon: (
      // ascending path
      <svg viewBox="0 0 24 24" fill="none" className={ICON_CLASS} aria-hidden>
        <path
          d="M4 19l5-5 3.5 3.5L20 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 9.5H20V14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const chipReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export default function Partnerships() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Slow vertical drift on the ambient glow only — cards keep their
      // own framer-motion transforms untouched.
      gsap.fromTo(
        glowRef.current,
        { yPercent: -12 },
        {
          yPercent: 12,
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
      id="partnerships"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* single faint pulse glow, right side — parallaxed by GSAP */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute right-[-12rem] top-1/3 h-[32rem] w-[32rem] rounded-full bg-pulse/5 blur-3xl" />
      </div>

      {/* masked blueprint grid patch behind the card field */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-[70%] w-[min(70rem,100%)] -translate-y-1/2 bg-grid-faint"
        style={{
          maskImage:
            "radial-gradient(ellipse 50% 50% at 65% 50%, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 50% 50% at 65% 50%, black 0%, transparent 70%)",
        }}
      />

      <div className="shell relative">
        <SectionHeading
          eyebrow={t("partnerships.eyebrow")}
          title={t("partnerships.title")}
          highlight={["Global", "Manufacturers"]}
          sub={t("partnerships.sub")}
        />

        {/* audience readout line */}
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.08, 0.2)}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted"
        >
          <motion.li variants={chipReveal} className="text-pulse/80">
            {t("partnerships.audience_prefix")}
          </motion.li>
          {AUDIENCES.map((audienceKey) => (
            <motion.li
              key={audienceKey}
              variants={chipReveal}
              className="flex items-center gap-3"
            >
              <span aria-hidden className="text-frost/20">
                ·
              </span>
              <span>{t(audienceKey)}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* six partnership-model protocol cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.1)}
          className="mt-16 grid gap-5 md:mt-20 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          {MODELS.map((model) => (
            <motion.div key={model.code} variants={fadeUp} className="h-full">
              <GlassCard
                animated={false}
                className="flex h-full flex-col p-8 hover:-translate-y-1.5 md:p-10"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline/[0.08] bg-surface/[0.03] text-silver transition-colors duration-500 ease-premium group-hover:border-pulse/30 group-hover:text-pulse">
                    {model.icon}
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-muted transition-colors duration-500 ease-premium group-hover:text-pulse/80">
                    {model.code}
                  </span>
                </div>

                <h3 className="mt-7 font-display text-xl font-medium text-frost">
                  {t(model.titleKey)}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-silver">
                  {t(model.bodyKey)}
                </p>

                {/* quiet accent line, extends on hover */}
                <div aria-hidden className="mt-auto pt-8">
                  <span className="block h-px w-10 bg-gradient-to-r from-pulse/50 to-transparent transition-all duration-500 ease-premium group-hover:w-24" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* closing CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
          className="mt-24 flex flex-col items-center md:mt-32"
        >
          <motion.span aria-hidden variants={lineGrow} className="hairline" />

          <motion.p
            variants={fadeUp}
            className="mt-14 font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted"
          >
            Adventum OS <span className="text-frost/25">·</span>{" "}
            {t("partnerships.channel_label")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryButton href="#contact">
              {t("partnerships.cta_primary")}
            </PrimaryButton>
            <GhostButton href="#contact">
              {t("partnerships.cta_secondary")}
            </GhostButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
