import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}
    >
      <body className="bg-abyss font-sans text-frost">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
