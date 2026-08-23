"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, VIEWPORT, fadeIn, stagger } from "@/lib/anim";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { useI18n } from "@/components/providers/I18nProvider";

/* ------------------------------------------------------------------ */
/*  Scientific Platform — the capability stack.                        */
/*  Three glass pillars over a faint molecular network: the argument   */
/*  that registration, supply and vigilance compound into a durable    */
/*  operating platform rather than a trading company.                  */
/* ------------------------------------------------------------------ */

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.5,
} as const;

/* ---------------------------- icons ------------------------------- */

function IconVirion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="4.75" {...STROKE} />
      <path
        d="M18.25 12h2.5M12 18.25v2.5M3.25 12h2.5M12 3.25v2.5M16.4 7.6l1.8-1.8M5.8 5.8l1.8 1.8M7.6 16.4l-1.8 1.8M16.4 16.4l1.8 1.8"
        {...STROKE}
        strokeLinecap="round"
      />
      <circle cx="10.6" cy="11.2" r="1" {...STROKE} />
    </svg>
  );
}

function IconInstitution() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M4.5 9.25 12 5l7.5 4.25"
        {...STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.75v4.75M10.25 11.75v4.75M13.75 11.75v4.75M17.5 11.75v4.75"
        {...STROKE}
        strokeLinecap="round"
      />
      <path d="M4.75 19.25h14.5" {...STROKE} strokeLinecap="round" />
    </svg>
  );
}

function IconShieldPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M12 3.5 18.25 5.8v5.05c0 4.28-2.6 7.43-6.25 9.65-3.65-2.22-6.25-5.37-6.25-9.65V5.8L12 3.5Z"
        {...STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.75h1.6l1-1.7 1.6 3.4 1-1.7h1.8"
        {...STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------- content ------------------------------ */

type Capability = {
  code: string;
  titleKey: string;
  descKey: string;
  accent: "bio" | "pulse";
  icon: ReactNode;
};

const CAPABILITIES: Capability[] = [
  {
    code: "CAP-01",
    titleKey: "platform.cap1_title",
    descKey: "platform.cap1_desc",
    accent: "bio",
    icon: <IconVirion />,
  },
  {
    code: "CAP-02",
    titleKey: "platform.cap2_title",
    descKey: "platform.cap2_desc",
    accent: "pulse",
    icon: <IconInstitution />,
  },
  {
    code: "CAP-03",
    titleKey: "platform.cap3_title",
    descKey: "platform.cap3_desc",
    accent: "bio",
    icon: <IconShieldPulse />,
  },
];

/* ------------- decorative molecular network (backdrop) ------------ */

const NET_NODES: ReadonlyArray<readonly [number, number]> = [
  [90, 120], [250, 60], [420, 150], [170, 300], [360, 340],
  [80, 490], [300, 570], [520, 470], [630, 90], [760, 220],
  [700, 430], [890, 130], [960, 330], [1090, 80], [1130, 430],
  [980, 570], [830, 620], [1150, 620], [560, 640], [480, 40],
];

const NET_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [0, 3], [2, 4], [3, 4], [3, 5], [5, 6], [4, 7],
  [6, 7], [2, 8], [8, 9], [9, 10], [7, 10], [9, 11], [11, 13],
  [12, 13], [10, 12], [12, 14], [14, 15], [15, 16], [10, 16],
  [14, 17], [15, 17], [7, 18], [18, 16], [19, 8], [19, 2],
];

const DRIFT_DOTS = [
  {
    pos: "left-[10%] top-[24%]",
    dot: "h-1 w-1 bg-pulse/60 shadow-[0_0_10px_rgba(47,131,214,0.55)]",
    delay: "0s",
  },
  {
    pos: "right-[12%] top-[32%]",
    dot: "h-1.5 w-1.5 bg-bio/50 shadow-[0_0_10px_rgba(104,210,223,0.5)]",
    delay: "-2.4s",
  },
  {
    pos: "left-[20%] bottom-[16%]",
    dot: "h-1 w-1 bg-pulse/40 shadow-[0_0_8px_rgba(47,131,214,0.4)]",
    delay: "-4.2s",
  },
  {
    pos: "right-[22%] bottom-[24%]",
    dot: "h-1 w-1 bg-pulse/50 shadow-[0_0_8px_rgba(47,131,214,0.5)]",
    delay: "-5.6s",
  },
];

/* --------------------------- variants ----------------------------- */

const chipReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function ScientificPlatform() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const netRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Gentle parallax on the molecular network as the section scrolls.
      gsap.fromTo(
        netRef.current,
        { yPercent: -6 },
        {
          yPercent: 6,
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
      id="platform"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* ---- ambient backdrop: network, grid, glows, drifting data points ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* molecular network, parallaxed */}
        <div ref={netRef} className="absolute inset-x-0 -inset-y-16">
          <svg
            viewBox="0 0 1200 720"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full text-pulse opacity-[0.06]"
          >
            <g stroke="currentColor" strokeWidth="1" fill="none">
              {NET_EDGES.map(([a, b], i) => (
                <line
                  key={i}
                  x1={NET_NODES[a][0]}
                  y1={NET_NODES[a][1]}
                  x2={NET_NODES[b][0]}
                  y2={NET_NODES[b][1]}
                />
              ))}
            </g>
            {NET_NODES.map(([x, y], i) =>
              i % 5 === 0 ? (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ) : (
                <circle key={i} cx={x} cy={y} r="1.8" fill="currentColor" />
              )
            )}
          </svg>
        </div>

        {/* faint blueprint grid behind the card field */}
        <div className="absolute left-1/2 top-[56%] h-[34rem] w-[70rem] max-w-none -translate-x-1/2 -translate-y-1/2 bg-grid-faint [mask-image:radial-gradient(ellipse_55%_55%_at_50%_50%,black,transparent_72%)]" />

        {/* accent blooms */}
        <div className="absolute left-[-8rem] top-[14%] h-[22rem] w-[22rem] rounded-full bg-pulse/[0.05] blur-3xl" />
        <div className="absolute bottom-[8%] right-[-9rem] h-[24rem] w-[24rem] rounded-full bg-bio/[0.04] blur-3xl" />

        {/* drifting data points */}
        {DRIFT_DOTS.map((d, i) => (
          <span
            key={i}
            className={`absolute ${d.pos} animate-drift-y`}
            style={{ animationDelay: d.delay }}
          >
            <span className={`block rounded-full ${d.dot}`} />
          </span>
        ))}
      </div>

      <div className="shell relative z-10">
        <SectionHeading
          eyebrow={t("platform.eyebrow")}
          title={t("platform.title")}
          highlight={["Scientific", "Operating"]}
          sub={t("platform.sub")}
          align="center"
        />

        {/* ---- capability index ---- */}
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.08, 0.15)}
          className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-y-4 md:mt-20"
        >
          {CAPABILITIES.map((cap, i) => (
            <motion.li
              key={cap.code}
              variants={chipReveal}
              className="flex items-center"
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-muted">
                {cap.code}
              </span>
              {i < CAPABILITIES.length - 1 && (
                <span
                  aria-hidden
                  className="mx-4 h-px w-5 bg-surface/10 md:mx-5 md:w-8"
                />
              )}
            </motion.li>
          ))}
        </motion.ol>

        {/* ---- capability modules ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.1)}
          className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          {CAPABILITIES.map((cap, i) => (
            <GlassCard
              key={cap.code}
              accent={cap.accent}
              className={`flex h-full flex-col p-8 ${
                // 2-col tablet grid: let the last of three cards span the
                // full row instead of sitting orphaned on the left.
                i === CAPABILITIES.length - 1 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border border-hairline/10 bg-surface/[0.04] text-silver transition-colors duration-500 ease-premium ${
                    cap.accent === "bio"
                      ? "group-hover:text-bio"
                      : "group-hover:text-pulse"
                  }`}
                >
                  {cap.icon}
                </span>
                <span className="pt-1 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted/70">
                  {cap.code}
                </span>
              </div>

              <h3 className="mt-7 font-display text-xl font-medium text-frost">
                {t(cap.titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t(cap.descKey)}
              </p>
            </GlassCard>
          ))}
        </motion.div>

        {/* ---- quiet system caption ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={fadeIn}
          className="mx-auto mt-20 flex max-w-md flex-col items-center gap-5 md:mt-28"
        >
          <div className="hairline" />
          <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.4em] text-muted">
            {t("platform.system_caption")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
