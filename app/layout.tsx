import type { Metadata, Viewport } from "next";
import { Carlito, IBM_Plex_Mono } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

// Carlito is the metric-compatible open clone of Calibri — the charter's
// primary typeface — so it renders the brand voice on the web without the
// proprietary font file. Used for both body and display (Calibri Bold).
const carlito = Carlito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adventum Pharma — Advancing Infectious Disease Care in Algeria",
  description:
    "Adventum Pharma develops, registers and commercializes critical infectious disease therapies in Algeria through regulatory excellence, hospital access and strategic international partnerships.",
  keywords: [
    "Adventum Pharma",
    "Algeria",
    "infectious diseases",
    "HIV",
    "antiretrovirals",
    "hospital therapies",
    "market access",
    "pharmaceutical partnerships",
  ],
  openGraph: {
    title: "Adventum Pharma — Advancing Infectious Disease Care in Algeria",
    description:
      "Critical infectious disease therapies for Algeria — regulatory excellence, hospital access, strategic international partnerships.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#02050c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${carlito.variable} ${plexMono.variable}`}
    >
      <body className="bg-abyss font-sans text-frost">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
