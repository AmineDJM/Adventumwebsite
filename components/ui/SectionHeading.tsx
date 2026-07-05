"use client";

import { motion } from "framer-motion";
import { EASE, VIEWPORT, stagger, wordReveal } from "@/lib/anim";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  /** Words to render with the luminous gradient */
  highlight?: string[];
  sub?: string;
  align?: "left" | "center";
  className?: string;
};

/**
 * Section header with numbered eyebrow, per-word staggered headline
 * and a quiet supporting paragraph.
 */
export default function SectionHeading({
  eyebrow,
  title,
  highlight = [],
  sub,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const words = title.split(" ");
  const isCenter = align === "center";

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={stagger(0.06)}
      className={`${isCenter ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
        }}
        className={`eyebrow mb-6 flex items-center gap-3 ${
          isCenter ? "justify-center" : ""
        }`}
      >
        <span className="inline-block h-px w-8 bg-gradient-to-r from-pulse/80 to-transparent" />
        {eyebrow}
      </motion.p>

      <h2
        className="font-display text-display-lg font-medium text-frost"
        style={{ perspective: "800px" }}
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 align-top">
            <motion.span
              variants={wordReveal}
              className={`inline-block will-change-transform ${
                highlight.includes(word.replace(/[.,]/g, ""))
                  ? "text-gradient-bio"
                  : ""
              }`}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </h2>

      {sub && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.9, ease: EASE, delay: 0.15 },
            },
          }}
          className={`mt-6 text-base leading-relaxed text-silver md:text-lg ${
            isCenter ? "mx-auto" : ""
          } max-w-2xl`}
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  );
}
