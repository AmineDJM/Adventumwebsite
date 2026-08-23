import type { Metadata, Viewport } from "next";
import { Carlito, IBM_Plex_Mono, Noto_Sans_Devanagari } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/providers/ThemeProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
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

// Devanagari for Hindi. Chinese falls back to the system CJK stack (declared
// in the Tailwind font family) to avoid shipping a multi-megabyte CJK webfont.
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "700"],
  variable: "--font-deva",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adventumdz.com";
const SITE_NAME = "Adventum Pharma";
const TITLE =
  "Adventum Pharma — Laboratoire pharmaceutique algérien · Maladies infectieuses";
const DESCRIPTION =
  "Adventum Pharma, laboratoire pharmaceutique algérien spécialisé en infectiologie : VIH / antirétroviraux, médicaments hospitaliers critiques et accès au marché en Algérie. Algerian pharmaceutical company advancing infectious disease care.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Adventum Pharma",
    "Adventum",
    "laboratoire pharmaceutique algérien",
    "laboratoire pharmaceutique Algérie",
    "pharmaceutical company Algeria",
    "Algerian pharmaceutical company",
    "maladies infectieuses Algérie",
    "infectious diseases Algeria",
    "infectiologie",
    "infectiology",
    "VIH Algérie",
    "HIV Algeria",
    "antirétroviraux",
    "antiretrovirals",
    "médicaments hospitaliers",
    "hospital medicines",
    "accès au marché pharmaceutique",
    "pharma Alger",
  ],
  category: "Pharmaceutical",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "fr_DZ",
    alternateLocale: ["en_US", "hi_IN", "zh_CN"],
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Adventum Pharma — laboratoire pharmaceutique algérien spécialisé en maladies infectieuses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  other: {
    "geo.region": "DZ-16",
    "geo.placename": "Alger",
  },
};

export const viewport: Viewport = {
  themeColor: "#02050c",
  width: "device-width",
  initialScale: 1,
};

// Structured data: lets Google / AI answer engines identify the company,
// where it operates and what it does. Kept factual — no medical claims.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "Adventum Pharma",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: "Info@adventumdz.com",
      description:
        "Laboratoire pharmaceutique algérien spécialisé dans les maladies infectieuses : thérapies VIH / antirétrovirales, médicaments hospitaliers critiques, enregistrement et accès au marché en Algérie. Algerian pharmaceutical company focused on infectious disease care.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Classe 45 GPR PROP 15 N°01, Cheraga",
        addressLocality: "Alger",
        addressCountry: "DZ",
      },
      areaServed: [{ "@type": "Country", name: "Algeria" }],
      knowsAbout: [
        "Infectious diseases",
        "HIV / Antiretroviral therapies",
        "Hospital medicines",
        "Pharmaceutical regulatory affairs",
        "Pharmaceutical market access in Algeria",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["fr", "en", "hi", "zh"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${carlito.variable} ${plexMono.variable} ${notoDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-abyss font-sans text-frost">
        <ThemeProvider>
          <I18nProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
