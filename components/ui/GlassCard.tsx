"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { fadeUp } from "@/lib/anim";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Accent tint used on hover glow: bio (teal) or pulse (blue) */
  accent?: "bio" | "pulse";
  /** Disable the built-in reveal animation (when parent orchestrates staggering) */
  animated?: boolean;
  /** Disable the pointer-reactive tilt (e.g. for very large panels) */
  tilt?: boolean;
};

const MAX_TILT = 5.5;

/**
 * Base glass surface — thin luminous border, backdrop blur, top-edge
 * highlight and, on fine-pointer devices, a subtle 3D tilt plus a
 * cursor-following sheen that makes the card feel physically present.
 */
export default function GlassCard({
  children,
  className = "",
  accent = "pulse",
  animated = true,
  tilt = true,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    setFinePointer(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  const interactive = tilt && !reduce && finePointer;

  // pointer position, normalized 0..1 within the card
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), {
    stiffness: 160,
    damping: 18,
  });
  const sheenX = useTransform(px, (v) => `${v * 100}%`);
  const sheenY = useTransform(py, (v) => `${v * 100}%`);
  const sheenColor = accent === "bio" ? "rgba(104,210,223,0.14)" : "rgba(47,131,214,0.14)";
  const sheen = useMotionTemplate`radial-gradient(220px circle at ${sheenX} ${sheenY}, ${sheenColor}, transparent 70%)`;

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const accentGlow =
    accent === "bio"
      ? "hover:shadow-[0_0_60px_-18px_rgba(104,210,223,0.4)]"
      : "hover:shadow-[0_0_60px_-18px_rgba(47,131,214,0.4)]";

  return (
    <motion.div
      ref={ref}
      variants={animated ? fadeUp : undefined}
      onPointerMove={interactive ? handleMove : undefined}
      onPointerLeave={interactive ? reset : undefined}
      style={
        interactive
          ? { rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }
          : undefined
      }
      className={`group relative overflow-hidden rounded-2xl glass glass-hover card-shadow transition-shadow duration-500 ease-premium ${accentGlow} ${className}`}
    >
      {/* top-edge light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-surface/25 to-transparent"
      />
      {/* cursor-following sheen (fine pointers only) */}
      {interactive && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: sheen }}
        />
      )}
      {/* static hover bloom (fallback / touch) */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100 ${
          accent === "bio" ? "bg-bio/10" : "bg-pulse/10"
        }`}
      />
      {children}
    </motion.div>
  );
}
