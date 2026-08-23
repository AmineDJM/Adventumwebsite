import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfectiologyFocus from "@/components/InfectiologyFocus";
import Mission from "@/components/Mission";
import RegulatoryJourney from "@/components/RegulatoryJourney";
import MarketAccess from "@/components/MarketAccess";
import ScientificPlatform from "@/components/ScientificPlatform";
import Partnerships from "@/components/Partnerships";
import Vision from "@/components/Vision";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AmbientBackdrop from "@/components/AmbientBackdrop";

export default function Home() {
  return (
    <>
      <AmbientBackdrop />
      <main className="relative z-10">
        <Navbar />
        <Hero />
        <InfectiologyFocus />
        <Mission />
        <RegulatoryJourney />
        <MarketAccess />
        <ScientificPlatform />
        <Partnerships />
        <Vision />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
