"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, stagger } from "@/lib/anim";
import { PrimaryButton, GhostButton } from "@/components/ui/Buttons";
import SquareMosaic from "@/components/ui/SquareMosaic";
import { useI18n } from "@/components/providers/I18nProvider";

const HIGHLIGHT = new Set(["Infectious", "Disease"]);

const CHIPS = [
  "hero.chip_arv",
  "hero.chip_hospital",
  "hero.chip_regulatory",
];

export default function Hero() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        yPercent: -18,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "85% top",
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden"
    >

      {/* cinematic vignette + bottom fade into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 45%, rgb(var(--bg) / 0.5) 100%)," +
            "linear-gradient(180deg, rgb(var(--bg) / 0.45) 0%, transparent 18%, transparent 72%, rgb(var(--bg)) 100%)",
        }}
      />

      {/* brand tile mosaic — signature top-right corner */}
      <SquareMosaic
        seed={11}
        columns={6}
        rows={4}
        anchor="tr"
        className="right-0 top-0 z-[2] h-[16rem] w-[26rem] max-w-[70vw] opacity-60"
      />

      <div ref={contentRef} className="shell relative z-10 pb-20 pt-40">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.12, 0.5)}
          className="max-w-4xl"
        >
          {/* system status line */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: EASE },
              },
            }}
            className="eyebrow mb-8 flex items-center gap-3"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bio opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bio" />
            </span>
            {t("hero.status")}
          </motion.p>

          {/* headline */}
          <h1
            className="font-display text-display-xl font-medium text-frost"
            style={{ perspective: "900px" }}
          >
            {t("hero.headline").split(" ").map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden pb-2 align-top"
              >
                <motion.span
                  variants={{
                    hidden: { y: "110%", rotateX: -35, opacity: 0 },
                    visible: {
                      y: 0,
                      rotateX: 0,
                      opacity: 1,
                      transition: { duration: 1, ease: EASE },
                    },
                  }}
                  className={`inline-block will-change-transform ${
                    HIGHLIGHT.has(word) ? "text-gradient-bio" : ""
                  }`}
                >
                  {word}
                  {" "}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 1, ease: EASE },
              },
            }}
            className="mt-8 max-w-2xl text-base leading-relaxed text-silver md:text-lg"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 1, ease: EASE },
              },
            }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton href="#infectiology">{t("hero.cta_primary")}</PrimaryButton>
            <GhostButton href="#contact">{t("hero.cta_secondary")}</GhostButton>
          </motion.div>

          {/* OS-style capability chips */}
          <motion.ul
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { duration: 1.2, ease: EASE, delay: 0.2 },
              },
            }}
            className="mt-16 flex flex-wrap gap-3"
          >
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="flex items-center gap-2.5 rounded-full border border-hairline/[0.08] bg-surface/[0.03] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver backdrop-blur-md"
              >
                <span className="h-1 w-1 rounded-full bg-pulse animate-pulse-soft" />
                {t(chip)}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 2 }}
        className="absolute bottom-10 right-10 z-10 hidden flex-col items-center gap-3 lg:flex"
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-muted">
          {t("hero.scroll")}
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-surface/10">
          <motion.span
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
            className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-pulse to-transparent"
          />
        </span>
      </motion.div>
    </section>
  );
}
