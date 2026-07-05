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

export function scrollToSection(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenisInstance) {
    lenisInstance.scrollTo(target as HTMLElement, {
      offset: -72,
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    (target as HTMLElement).scrollIntoView({ behavior: "smooth" });
  }
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
