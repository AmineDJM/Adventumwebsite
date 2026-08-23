"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Code-split the interactive explorer; it lives well below the fold.
const InfectionLab = dynamic(() => import("./InfectionLab"), {
  ssr: false,
  loading: () => <LabPlaceholder />,
});

/**
 * Height-faithful placeholder (min-heights measured against the mounted
 * section per breakpoint). Keeping the reserved space honest means the
 * page height barely moves when the real module mounts — so a menu
 * scroll gliding past never hits a layout jump.
 */
function LabPlaceholder() {
  return (
    <section
      id="lab"
      className="section-pad min-h-[1590px] md:min-h-[1620px] lg:min-h-[1360px] xl:min-h-[1420px]"
    >
      <div className="shell">
        <div className="mx-auto aspect-square w-full max-w-[34rem] rounded-[2rem] glass" />
      </div>
    </section>
  );
}

/**
 * Mounts the Three.js module during browser idle time shortly after load
 * (or when the section approaches the viewport, whichever comes first).
 * Idle-mounting keeps the heavy chunk download + WebGL init out of the
 * scroll path, so menu navigation stays perfectly smooth.
 */
export default function InfectionLabClient() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleHandle: number | undefined;
    let timerHandle: ReturnType<typeof setTimeout> | undefined;
    const el = ref.current;

    const mount = () => setReady(true);

    // 1. idle path — after the page has settled
    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(mount, { timeout: 3500 });
    } else {
      timerHandle = setTimeout(mount, 2200);
    }

    // 2. proximity path — user heads there before idle fires
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          mount();
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    if (el) io.observe(el);

    return () => {
      if (idleHandle !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timerHandle !== undefined) clearTimeout(timerHandle);
      io.disconnect();
    };
  }, []);

  return <div ref={ref}>{ready ? <InfectionLab /> : <LabPlaceholder />}</div>;
}
