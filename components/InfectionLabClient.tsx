"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Code-split the interactive explorer; it lives well below the fold.
const InfectionLab = dynamic(() => import("./InfectionLab"), {
  ssr: false,
  loading: () => <LabPlaceholder />,
});

function LabPlaceholder() {
  return (
    <section id="lab" className="section-pad">
      <div className="shell">
        <div className="mx-auto aspect-square w-full max-w-[34rem] rounded-[2rem] glass" />
      </div>
    </section>
  );
}

/**
 * Defers even the *download* of the Three.js chunk until the section is
 * close to the viewport, so visitors who never scroll here never pay for it.
 */
export default function InfectionLabClient() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <InfectionLab /> : <LabPlaceholder />}</div>;
}
