"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VIEWPORT, fadeIn, stagger } from "@/lib/anim";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";

/* ------------------------------------------------------------------ */
/*  Mission — the supply-of-care schematic.                            */
/*  Four glass nodes (Manufacturer → Regulatory → Hospital Market →    */
/*  Patient Access) joined by a gradient connector that draws itself   */
/*  as the section scrolls, lighting a pulsing beacon at each node.    */
/*  Horizontal rail on lg, vertical spine on mobile.                   */
/* ------------------------------------------------------------------ */

type FlowNode = {
  tag: string;
  title: string;
  desc: string;
  accent: "bio" | "pulse";
  icon: ReactNode;
};

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.5,
} as const;

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="8.25" {...STROKE} />
      <path d="M3.75 12h16.5" {...STROKE} strokeLinecap="round" />
      <path
        d="M12 3.75c2.6 2.16 4 5.04 4 8.25s-1.4 6.09-4 8.25c-2.6-2.16-4-5.04-4-8.25s1.4-6.09 4-8.25Z"
        {...STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShieldDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M12 3.5 18.25 5.8v5.05c0 4.28-2.6 7.43-6.25 9.65-3.65-2.22-6.25-5.37-6.25-9.65V5.8L12 3.5Z"
        {...STROKE}
        strokeLinejoin="round"
      />
      <path d="M9.5 10.25h5" {...STROKE} strokeLinecap="round" />
      <path d="M9.5 13.25h3" {...STROKE} strokeLinecap="round" />
    </svg>
  );
}

function IconHospital() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M5.25 20.25V7.5a1 1 0 0 1 1-1h11.5a1 1 0 0 1 1 1v12.75"
        {...STROKE}
        strokeLinejoin="round"
      />
      <path d="M3.5 20.25h17" {...STROKE} strokeLinecap="round" />
      <path
        d="M12 9.25v4.5M9.75 11.5h4.5"
        {...STROKE}
        strokeLinecap="round"
      />
      <path
        d="M10 20.25v-2.75a2 2 0 0 1 4 0v2.75"
        {...STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeartPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M12 20.1S4.25 15.35 4.25 10.1c0-2.6 1.95-4.6 4.35-4.6 1.4 0 2.6.65 3.4 1.75.8-1.1 2-1.75 3.4-1.75 2.4 0 4.35 2 4.35 4.6 0 5.25-7.75 10-7.75 10Z"
        {...STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M8.25 11.75h1.9l1.1-1.9 1.6 3.4 1.1-1.9h1.8"
        {...STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NODES: FlowNode[] = [
  {
    tag: "Node 01",
    title: "Manufacturer",
    desc: "International partners and licensed originators.",
    accent: "pulse",
    icon: <IconGlobe />,
  },
  {
    tag: "Node 02",
    title: "Regulatory",
    desc: "Dossier, submission and registration follow-up.",
    accent: "pulse",
    icon: <IconShieldDoc />,
  },
  {
    tag: "Node 03",
    title: "Hospital Market",
    desc: "Tenders, procurement and institutional deployment.",
    accent: "pulse",
    icon: <IconHospital />,
  },
  {
    tag: "Node 04",
    title: "Patient Access",
    desc: "Reliable availability where treatment happens.",
    accent: "bio",
    icon: <IconHeartPulse />,
  },
];

/** Pulsing beacon rendered at each node; opacity is driven by GSAP. */
function Beacon({ className = "" }: { className?: string }) {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-bio/40 blur-[3px] animate-pulse-soft" />
      <span
        className={`relative rounded-full bg-bio shadow-[0_0_12px_rgba(104,210,223,0.8)] ${className}`}
      />
    </>
  );
}

export default function Mission() {
  const sectionRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: flowRef.current,
          start: "top 78%",
          end: "bottom 42%",
          scrub: 0.8,
        },
      });

      // The connector draws itself from origin to point of care.
      tl.fromTo(
        ".mission-path",
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 1, ease: "none" },
        0
      );

      // Beacons (and direction ticks) ignite as the line reaches them.
      const dots =
        sectionRef.current?.querySelectorAll<HTMLElement>(".mission-dot");
      dots?.forEach((dot) => {
        const step = parseFloat(dot.dataset.step ?? "0");
        const at = Math.max(0, 0.125 + step * 0.25 - 0.04);
        tl.fromTo(
          dot,
          { opacity: 0, scale: 0.4 },
          { opacity: 1, scale: 1, duration: 0.08, ease: "none" },
          at
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="mission"
      ref={sectionRef}
      className="relative overflow-hidden section-pad"
    >
      {/* ---- ambient backdrop: one bio bloom + faint blueprint grid ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[58%] h-[26rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bio/[0.05] blur-3xl" />
        <div className="absolute right-[-10rem] top-[-6rem] h-[20rem] w-[20rem] rounded-full bg-pulse/[0.04] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 bg-grid-faint [mask-image:radial-gradient(ellipse_55%_60%_at_50%_50%,black,transparent_72%)]" />
      </div>

      <div className="shell relative z-10">
        <SectionHeading
          eyebrow="02 · Mission"
          title="Strengthening Access to Critical Medicines"
          highlight={["Access"]}
          sub="Adventum Pharma is built around one mission: improving access to essential infectious disease treatments in Algeria through disciplined regulatory execution, reliable supply chains and long-term partnerships with international manufacturers."
          align="center"
        />

        {/* ---- value-flow schematic ---- */}
        <div
          ref={flowRef}
          className="relative mx-auto mt-24 w-full max-w-2xl md:mt-32 lg:mt-36 lg:max-w-none"
        >
          {/* vertical spine — mobile / tablet */}
          <svg
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-[5px] top-0 h-full w-[2px] overflow-visible lg:hidden"
          >
            <defs>
              <linearGradient
                id="mission-grad-v"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0%"
                x2="0"
                y2="100%"
              >
                <stop offset="0%" stopColor="#68D2DF" stopOpacity="0" />
                <stop offset="10%" stopColor="#68D2DF" />
                <stop offset="88%" stopColor="#2f83d6" />
                <stop offset="100%" stopColor="#2f83d6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="1"
              y1="0%"
              x2="1"
              y2="100%"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <line
              className="mission-path"
              x1="1"
              y1="0%"
              x2="1"
              y2="100%"
              stroke="url(#mission-grad-v)"
              strokeWidth="1.5"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100}
              style={{ filter: "drop-shadow(0 0 6px rgba(104,210,223,0.45))" }}
            />
          </svg>

          {/* horizontal rail — desktop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[6px] hidden h-[2px] lg:block"
          >
            <svg className="h-full w-full overflow-visible">
              <defs>
                <linearGradient
                  id="mission-grad-h"
                  gradientUnits="userSpaceOnUse"
                  x1="0%"
                  y1="0"
                  x2="100%"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#68D2DF" stopOpacity="0" />
                  <stop offset="10%" stopColor="#68D2DF" />
                  <stop offset="88%" stopColor="#2f83d6" />
                  <stop offset="100%" stopColor="#2f83d6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line
                x1="0%"
                y1="1"
                x2="100%"
                y2="1"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <line
                className="mission-path"
                x1="0%"
                y1="1"
                x2="100%"
                y2="1"
                stroke="url(#mission-grad-h)"
                strokeWidth="1.5"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100}
                style={{
                  filter: "drop-shadow(0 0 6px rgba(104,210,223,0.45))",
                }}
              />
            </svg>

            {/* direction ticks between nodes */}
            {[25, 50, 75].map((pos, i) => (
              <span
                key={pos}
                data-step={i + 0.5}
                className="mission-dot absolute -top-1 -ml-[5px] opacity-0"
                style={{ left: `${pos}%` }}
              >
                <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5 text-silver/60" aria-hidden>
                  <path
                    d="M3.5 2 7 5 3.5 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ))}
          </div>

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={stagger(0.12)}
            className="grid gap-14 lg:grid-cols-4 lg:gap-8"
          >
            {NODES.map((node, i) => (
              <li
                key={node.title}
                className="relative pl-12 lg:flex lg:flex-col lg:items-center lg:pl-0"
              >
                {/* beacon on the mobile spine */}
                <span
                  aria-hidden
                  data-step={i}
                  className="mission-dot absolute left-0 top-[50px] flex h-3 w-3 items-center justify-center opacity-0 lg:hidden"
                >
                  <Beacon className="h-1.5 w-1.5" />
                </span>

                {/* beacon on the desktop rail */}
                <span
                  aria-hidden
                  data-step={i}
                  className="mission-dot relative mb-4 hidden h-3.5 w-3.5 items-center justify-center opacity-0 lg:flex"
                >
                  <Beacon className="h-2 w-2" />
                </span>

                {/* stem from rail to card */}
                <span
                  aria-hidden
                  className="mb-6 hidden h-10 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent lg:block"
                />

                <GlassCard
                  accent={node.accent}
                  className="flex w-full flex-col p-8 lg:flex-1"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-silver transition-colors duration-500 ease-premium ${
                      node.accent === "bio"
                        ? "group-hover:text-bio"
                        : "group-hover:text-pulse"
                    }`}
                  >
                    {node.icon}
                  </span>

                  <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted">
                    {node.tag}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-medium text-frost">
                    {node.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {node.desc}
                  </p>
                </GlassCard>
              </li>
            ))}
          </motion.ol>
        </div>

        {/* ---- quiet system caption ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={fadeIn}
          className="mx-auto mt-24 flex max-w-md flex-col items-center gap-5 md:mt-32"
        >
          <div className="hairline" />
          <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.4em] text-muted">
            Supply-of-care continuum · Origin to point of treatment
          </p>
        </motion.div>
      </div>
    </section>
  );
}
