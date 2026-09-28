import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AmbientBackdrop from "@/components/AmbientBackdrop";

/** Shared chrome for sub-pages (Insights, Careers). */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackdrop />
      <main className="relative z-10">
        <Navbar />
        <div className="pt-[72px]">{children}</div>
        <Footer />
      </main>
    </>
  );
}
