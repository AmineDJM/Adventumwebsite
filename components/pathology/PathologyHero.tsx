"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { EASE, stagger } from "@/lib/anim";
import { useI18n } from "@/components/providers/I18nProvider";
import { parseHighlight, plainTitle } from "@/lib/i18n/highlight";
import { PrimaryButton, GhostButton } from "@/components/ui/Buttons";

export default function PathologyHero() {
  const { t } = useI18n();
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, transparent 40%, rgb(var(--bg) / 0.4) 100%)",
        }}
      />
      <div className="shell relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.12, 0.3)}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
            className="eyebrow mb-8 flex items-center justify-center gap-3"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bio opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bio" />
            </span>
            {t("path.hero_eyebrow")}
          </motion.p>

          <h1
            aria-label={plainTitle(t("path.hero_title"))}
            className="font-display text-display-xl font-medium text-frost"
            style={{ perspective: "900px" }}
          >
            {parseHighlight(t("path.hero_title")).map((tk, i) =>
              tk.word.trim() === "" ? (
                <Fragment key={i}> </Fragment>
              ) : (
                <span key={i} aria-hidden className="inline-block overflow-hidden pb-2 align-top">
                  <motion.span
                    variants={{
                      hidden: { y: "110%", opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 1, ease: EASE } },
                    }}
                    className={`inline-block will-change-transform ${tk.hl ? "text-gradient-bio" : ""}`}
                  >
                    {tk.word}
                  </motion.span>
                </span>
              )
            )}
          </h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
            }}
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-silver md:text-lg"
          >
            {t("path.hero_sub")}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryButton href="#hiv-cycle">{t("path.hero_cta")}</PrimaryButton>
            <GhostButton href="/">{t("path.back")}</GhostButton>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 1.4 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="relative h-12 w-px overflow-hidden bg-hairline/15">
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
