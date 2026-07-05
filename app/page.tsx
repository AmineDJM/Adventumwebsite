import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfectiologyFocus from "@/components/InfectiologyFocus";
import Mission from "@/components/Mission";
import Portfolio from "@/components/Portfolio";
import RegulatoryJourney from "@/components/RegulatoryJourney";
import MarketAccess from "@/components/MarketAccess";
import ScientificPlatform from "@/components/ScientificPlatform";
import Partnerships from "@/components/Partnerships";
import Vision from "@/components/Vision";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <InfectiologyFocus />
      <Mission />
      <Portfolio />
      <RegulatoryJourney />
      <MarketAccess />
      <ScientificPlatform />
      <Partnerships />
      <Vision />
      <Contact />
      <Footer />
    </main>
  );
}
