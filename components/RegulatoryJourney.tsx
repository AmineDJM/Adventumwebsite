"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import { EASE, VIEWPORT, fadeUp, stagger } from "@/lib/anim";

/* ------------------------------------------------------------------ */
/*  Regulatory & Market Access Engine — an 8-stage vertical timeline.  */
/*  A gradient progress spine fills on scroll (GSAP scrub) and each    */
/*  stage node lights up as the line passes it. Mission-control calm.  */
/* ------------------------------------------------------------------ */

const STATUS_CHIPS = ["END-TO-END", "REGULATORY-FIRST", "LIFECYCLE MANAGED"];

const STEPS = [
  {
    num: "01",
    title: "Product selection",
    body: "Therapeutic value, unmet hospital need and supply criticality drive every candidate.",
  },
  {
    num: "02",
    title: "Partner qualification",
    body: "Due diligence on manufacturing quality, capacity and reliability.",
  },
  {
    num: "03",
    title: "Dossier preparation",
    body: "Complete, submission-ready technical and clinical documentation.",
  },
  {
    num: "04",
    title: "Regulatory submission",
    body: "Structured filing with the national regulatory authority.",
  },
  {
    num: "05",
    title: "Registration follow-up",
    body: "Active management of questions, commitments and timelines.",
  },
  {
    num: "06",
    title: "Tender access",
    body: "Positioning for institutional tenders and procurement programs.",
  },
  {
    num: "07",
    title: "Hospital deployment",
    body: "Distribution, availability and institutional support.",
  },
  {
    num: "08",
    title: "Lifecycle management",
    body: "Variations, renewals, vigilance and continuous supply.",
  },
] as const;

export default function RegulatoryJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Gradient spine fills as the viewport centerline travels the rail.
      if (railRef.current && progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: railRef.current,
              start: "top center",
              end: "bottom center",
              scrub: true,
            },
          }
        );
      }

      // Each node lights up the moment the progress tip passes it.
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          onEnter: () => setActiveStep((s) => Math.max(s, i)),
          onLeaveBack: () => setActiveStep(i - 1),
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="regulatory"
      ref={sectionRef}
      className="relative overflow-x-clip section-pad"
    >
      {/* ------- decorative backdrop ------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse/15 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 right-[-12%] h-[32rem] w-[32rem] rounded-full bg-pulse/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-[-12%] h-[28rem] w-[28rem] rounded-full bg-bio/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full bg-grid-faint opacity-50 md:w-1/2 [mask-image:radial-gradient(ellipse_55%_45%_at_70%_45%,black,transparent_75%)]"
      />

      <div className="shell relative">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          {/* ------- LEFT · sticky heading ------- */}
          <div className="self-start lg:sticky lg:top-32 lg:col-span-5">
            <SectionHeading
              eyebrow="04 · Regulatory Engine"
              title="From Dossier to Hospital Bedside"
              highlight={["Dossier"]}
              sub="A disciplined, end-to-end registration and market-access engine built for the Algerian regulatory environment — from candidate selection to lifecycle stewardship."
            />

            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.1, 0.25)}
              className="mt-10 flex flex-wrap gap-3"
            >
              {STATUS_CHIPS.map((chip) => (
                <motion.li
                  key={chip}
                  variants={fadeUp}
                  className="glass flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver"
                >
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-full bg-bio animate-pulse-soft"
                  />
                  {chip}
                </motion.li>
              ))}
            </motion.ul>

            {/* live engine readout */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={VIEWPORT}
              transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
              className="mt-12 hidden items-center gap-4 lg:flex"
              aria-hidden
            >
              <span className="hairline max-w-[6rem]" />
              <span className="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted">
                Stage {String(Math.min(activeStep + 1, STEPS.length)).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </span>
            </motion.div>
          </div>

          {/* ------- RIGHT · timeline engine ------- */}
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.8, ease: EASE }}
              className="mb-8 flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.35em] text-muted"
            >
              <svg
                className="h-3.5 w-3.5 text-pulse/70"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M8 1.5v3m0 7v3M14.5 8h-3m-7 0h-3M8 6a2 2 0 100 4 2 2 0 000-4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Registration Pipeline · 8 Stages
            </motion.p>

            <div ref={railRef} className="relative">
              {/* spine */}
              <div
                aria-hidden
                className="absolute bottom-3 left-[10px] top-3 w-px bg-white/[0.08]"
              />
              {/* gradient progress — scaleY driven by ScrollTrigger scrub */}
              <div
                ref={progressRef}
                aria-hidden
                className="absolute bottom-3 left-[10px] top-3 w-px origin-top bg-gradient-to-b from-bio via-pulse to-pulse"
                style={{ transform: "scaleY(0)" }}
              />

              <motion.ol
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                variants={stagger(0.09)}
                className="space-y-4 md:space-y-5"
              >
                {STEPS.map((step, i) => {
                  const lit = i <= activeStep;
                  return (
                    <motion.li
                      key={step.num}
                      ref={(el) => {
                        stepRefs.current[i] = el;
                      }}
                      variants={fadeUp}
                      className="relative pl-10 sm:pl-14"
                    >
                      {/* spine node */}
                      <span
                        aria-hidden
                        className={`absolute left-[1px] top-9 flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-all duration-500 ease-premium ${
                          lit
                            ? "border-bio/60 bg-bio/10 shadow-[0_0_18px_-2px_rgba(62,230,168,0.55)]"
                            : "border-white/15 bg-abyss"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ease-premium ${
                            lit ? "bg-bio" : "bg-white/20"
                          }`}
                        />
                      </span>

                      {/* stage panel */}
                      <div className="group glass glass-hover card-shadow relative overflow-hidden rounded-2xl p-8">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <div className="flex items-start gap-6">
                          <span
                            className={`font-mono text-2xl leading-none tracking-tight transition-colors duration-500 ease-premium group-hover:text-bio ${
                              lit ? "text-bio/70" : "text-muted/50"
                            }`}
                          >
                            {step.num}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-medium text-frost md:text-xl">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                              {step.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
