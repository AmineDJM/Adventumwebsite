"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, VIEWPORT, fadeUp, lineGrow, stagger } from "@/lib/anim";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";

/* ---------------------------------------------------------------- icons */

function VirionIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M18 12h2.2M15 17.2l1.1 1.9M9 17.2l-1.1 1.9M6 12H3.8M9 6.8L7.9 4.9M15 6.8l1.1-1.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="21.3" cy="12" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.8" cy="20" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.2" cy="20" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2.7" cy="12" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.2" cy="4" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.8" cy="4" r="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function HospitalHexIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.6l8 4.62v9.56l-8 4.62-8-4.62V7.22l8-4.62z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.5v7M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PopulationIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="5.5" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="18.5"
        cy="6.5"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="5.5"
        cy="18.5"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="18.5" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.4 11L6.8 7.2M13.8 10.8l3.4-3.2M10.2 14.1L7 17.2M13.9 14l3.2 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SupplyRouteIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5.7 18.5c4 0 3.2-6.5 6.3-6.5s2.3-6.5 6.3-6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="18.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* --------------------------------------------------- hex lattice pattern */

function HexLattice({ id }: { id: string }) {
  const mask =
    "radial-gradient(circle at 72% 28%, black 25%, transparent 78%)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      fill="none"
      className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-frost opacity-[0.05]"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <pattern
          id={id}
          width="17.32"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8.66 -2.5L17.32 2.5v10L8.66 17.5 0 12.5v-10L8.66 -2.5zM0 12.5l8.66 5v10L0 32.5l-8.66-5v-10L0 12.5zM17.32 12.5l8.66 5v10l-8.66 5-8.66-5v-10l8.66-5z"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="120" height="120" fill={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ data */

type FocusArea = {
  title: string;
  tag: string;
  body: string;
  accent: "bio" | "pulse";
  icon: ReactNode;
};

const FOCUS_AREAS: FocusArea[] = [
  {
    title: "HIV / Antiretrovirals",
    tag: "ARV · Priority Axis",
    body: "Modern antiretroviral therapies for national HIV programs and specialized hospital services — the central axis of our portfolio.",
    accent: "bio",
    icon: <VirionIcon />,
  },
  {
    title: "Hospital Infectious Diseases",
    tag: "Acute Care",
    body: "Therapies addressing severe bacterial, viral and fungal infections treated in hospital settings, where continuity of care is critical.",
    accent: "pulse",
    icon: <HospitalHexIcon />,
  },
  {
    title: "Public Health Therapeutics",
    tag: "Population Health",
    body: "Medicines aligned with national public-health priorities and structured treatment programs across the care system.",
    accent: "bio",
    icon: <PopulationIcon />,
  },
  {
    title: "Strategic Supply Access",
    tag: "Supply Continuity",
    body: "Structured import, registration and supply pathways for critical therapies that hospitals cannot source reliably.",
    accent: "pulse",
    icon: <SupplyRouteIcon />,
  },
];

const MOLECULES = [
  "Dolutegravir",
  "Raltegravir",
  "Darunavir",
  "Hospital anti-infectives",
];

/* ------------------------------------------------------------- component */

export default function InfectiologyFocus() {
  const sectionRef = useRef<HTMLElement>(null);
  const glowTopRef = useRef<HTMLDivElement>(null);
  const glowBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const scrollTrigger = {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      };
      gsap.to(glowTopRef.current, { yPercent: 30, ease: "none", scrollTrigger });
      gsap.to(glowBottomRef.current, {
        yPercent: -24,
        ease: "none",
        scrollTrigger,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="infectiology"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* decorative atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          ref={glowTopRef}
          className="absolute -top-40 right-[-12%] h-[30rem] w-[30rem] rounded-full bg-pulse/5 blur-3xl"
        />
        <div
          ref={glowBottomRef}
          className="absolute bottom-[-8rem] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-bio/5 blur-3xl"
        />
        <div
          className="absolute inset-x-0 top-0 h-[38rem] bg-grid-faint"
          style={{
            maskImage:
              "radial-gradient(ellipse 65% 55% at 75% 0%, black, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 55% at 75% 0%, black, transparent 72%)",
          }}
        />
      </div>

      <div className="shell relative">
        <SectionHeading
          eyebrow="01 · Infectiology Focus"
          title="Critical Therapies for Infectious Disease Care"
          highlight={["Critical", "Therapies"]}
          sub="Adventum Pharma concentrates exclusively on infectious diseases and critical hospital therapies for the Algerian market — depth over breadth."
        />

        {/* focus grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
          className="mt-16 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-2 md:gap-6"
        >
          {FOCUS_AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="h-full"
            >
              <GlassCard animated={false} accent={area.accent} className="h-full">
                <div className="relative flex h-full flex-col p-8 md:p-10">
                  <HexLattice id={`infectiology-hex-${i}`} />

                  <div className="relative flex items-start justify-between gap-4">
                    {/* icon chip */}
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md transition-colors duration-500 ease-premium ${
                        area.accent === "bio"
                          ? "text-bio/90 group-hover:border-bio/25"
                          : "text-pulse/90 group-hover:border-pulse/25"
                      }`}
                    >
                      {area.icon}
                    </span>

                    {/* mono tag */}
                    <span className="mt-1 flex items-center gap-2.5 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-muted">
                      <span
                        aria-hidden
                        className={`h-1 w-1 rounded-full animate-pulse-soft ${
                          area.accent === "bio" ? "bg-bio" : "bg-pulse"
                        }`}
                      />
                      {area.tag}
                    </span>
                  </div>

                  <h3 className="relative mt-8 font-display text-xl font-medium text-frost md:text-2xl">
                    {area.title}
                  </h3>
                  <p className="relative mt-3 max-w-md text-sm leading-relaxed text-silver md:text-[0.95rem]">
                    {area.body}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* molecule strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.1)}
          className="mt-16 md:mt-20"
        >
          <motion.div variants={lineGrow} className="hairline origin-left" />

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-baseline lg:justify-between"
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted">
              Portfolio · Pipeline Focus
            </p>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-silver">
              {MOLECULES.map((molecule, i) => (
                <li key={molecule} className="flex items-center gap-3">
                  <span>{molecule}</span>
                  {i < MOLECULES.length - 1 && (
                    <span aria-hidden className="text-white/20">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-2xl text-xs leading-relaxed text-muted"
          >
            Portfolio and pipeline focus examples. Product availability is
            subject to registration status in each market.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
