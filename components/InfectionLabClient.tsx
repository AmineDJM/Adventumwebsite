"use client";

import dynamic from "next/dynamic";

// Code-split the interactive explorer; it lives well below the fold.
const InfectionLab = dynamic(() => import("./InfectionLab"), {
  ssr: false,
  loading: () => (
    <section id="lab" className="section-pad">
      <div className="shell">
        <div className="mx-auto aspect-square w-full max-w-[34rem] rounded-[2rem] glass" />
      </div>
    </section>
  ),
});

export default function InfectionLabClient() {
  return <InfectionLab />;
}
