"use client";

import dynamic from "next/dynamic";
import PathologyNav from "@/components/pathology/PathologyNav";
import PathologyHero from "@/components/pathology/PathologyHero";
import Footer from "@/components/Footer";

const loading = (
  <section className="section-pad">
    <div className="shell">
      <div className="mx-auto aspect-[16/10] w-full max-w-5xl rounded-[2rem] glass" />
    </div>
  </section>
);

const SceneBackdrop = dynamic(
  () => import("@/components/three/SceneBackdrop"),
  { ssr: false }
);
const HIVCycle = dynamic(() => import("@/components/pathology/HIVCycle"), {
  ssr: false,
  loading: () => loading,
});
const MechanismDock = dynamic(
  () => import("@/components/pathology/MechanismDock"),
  { ssr: false, loading: () => loading }
);
const InfectionLab = dynamic(() => import("@/components/InfectionLab"), {
  ssr: false,
  loading: () => loading,
});

export default function PathologyContent() {
  return (
    <>
      <SceneBackdrop />
      <PathologyNav />
      <main className="relative z-10">
        <PathologyHero />
        <HIVCycle />
        <MechanismDock />
        <InfectionLab />
        <Footer />
      </main>
    </>
  );
}
