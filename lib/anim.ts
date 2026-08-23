import type { Variants } from "framer-motion";

/**
 * Shared motion language.
 * One easing curve, a narrow duration band (0.6s–1.2s) and consistent
 * stagger rhythm keep every section feeling like one continuous film.
 */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Bottom margin is positive so entrances arm slightly BEFORE a section
// scrolls into view: during a long menu scroll the work is spread along
// the flight instead of piling up in one heavy frame at the landing.
export const VIEWPORT = { once: true, margin: "-10% 0px 10% 0px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.1, ease: EASE },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: EASE },
  },
};

export const stagger = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

export const lineGrow: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 1.2, ease: EASE },
  },
};
