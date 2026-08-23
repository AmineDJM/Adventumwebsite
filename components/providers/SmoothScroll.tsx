"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;

/** Access the live Lenis instance (client only), e.g. for anchor scrolling. */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

const ANCHOR_OFFSET = -72; // fixed header height

export function scrollToSection(hash: string) {
  const target = document.querySelector(hash) as HTMLElement | null;
  if (!target) return;
  const lenis = lenisInstance;
  if (!lenis) {
    target.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const easing = (t: number) => 1 - Math.pow(1 - t, 4);
  lenis.scrollTo(target, {
    offset: ANCHOR_OFFSET,
    duration: 1.15,
    easing,
    // The mobile menu stops Lenis while open; without force a scroll
    // requested during that lock is silently dropped.
    force: true,
    onComplete: () => {
      // Lazily mounted sections (e.g. the 3D lab) can grow the page while
      // a long scroll is in flight, leaving the anchor short of the
      // viewport. Correct once against the final layout.
      const drift = target.getBoundingClientRect().top + ANCHOR_OFFSET;
      if (Math.abs(drift) > 8) {
        lenis.scrollTo(target, {
          offset: ANCHOR_OFFSET,
          duration: 0.45,
          easing,
          force: true,
        });
      }
    },
  });
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
