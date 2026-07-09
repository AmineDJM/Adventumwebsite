import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfectiologyFocus from "@/components/InfectiologyFocus";
import Mission from "@/components/Mission";
import Portfolio from "@/components/Portfolio";
import RegulatoryJourney from "@/components/RegulatoryJourney";
import MarketAccess from "@/components/MarketAccess";
import ScientificPlatform from "@/components/ScientificPlatform";
import InfectionLab from "@/components/InfectionLabClient";
import Partnerships from "@/components/Partnerships";
import Vision from "@/components/Vision";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
// Persistent full-page 3D laboratory the camera flies through on scroll.
// Lazy-loaded (code-split) via a client wrapper so Three.js stays out of
// the initial bundle.
import SceneBackdrop from "@/components/three/SceneBackdropClient";

export default function Home() {
  return (
    <>
      <SceneBackdrop />
      <main className="relative z-10">
        <Navbar />
        <Hero />
        <InfectiologyFocus />
        <Mission />
        <Portfolio />
        <RegulatoryJourney />
        <MarketAccess />
        <ScientificPlatform />
        <InfectionLab />
        <Partnerships />
        <Vision />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
