"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/anim";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Accent tint used on hover glow: bio (green) or pulse (cyan) */
  accent?: "bio" | "pulse";
  /** Disable the built-in reveal animation (when parent orchestrates staggering) */
  animated?: boolean;
};

/**
 * Base glass surface — thin luminous border, backdrop blur, top-edge
 * highlight and a soft accent bloom on hover.
 */
export default function GlassCard({
  children,
  className = "",
  accent = "pulse",
  animated = true,
}: GlassCardProps) {
  const accentGlow =
    accent === "bio"
      ? "hover:shadow-[0_0_60px_-18px_rgba(62,230,168,0.35)]"
      : "hover:shadow-[0_0_60px_-18px_rgba(76,215,246,0.35)]";

  const Comp = animated ? motion.div : "div";
  const motionProps = animated ? { variants: fadeUp } : {};

  return (
    <Comp
      {...motionProps}
      className={`group relative overflow-hidden rounded-2xl glass glass-hover card-shadow ${accentGlow} ${className}`}
    >
      {/* top-edge light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {/* hover bloom */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100 ${
          accent === "bio" ? "bg-bio/10" : "bg-pulse/10"
        }`}
      />
      {children}
    </Comp>
  );
}
