import type { Metadata, Viewport } from "next";
import { Carlito, IBM_Plex_Mono, Noto_Sans_Devanagari } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/providers/ThemeProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  jsonLdScript,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: DEFAULT_KEYWORDS,
  category: "Pharmaceutical",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: SITE_LOCALE,
    alternateLocale: ["en_US", "hi_IN", "zh_CN"],
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Adventum Pharma — laboratoire pharmaceutique algérien",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og.png"],
  },
  other: {
    "geo.region": "DZ-16",
    "geo.placename": "Alger",
    "geo.position": "36.7538;3.0588",
    ICBM: "36.7538, 3.0588",
  },
};

export const viewport: Viewport = {
  themeColor: "#02050c",
  width: "device-width",
  initialScale: 1,
};

// Site-wide structured data. Page-level nodes (Blog, BlogPosting,
// JobPosting, BreadcrumbList) reference these by @id.
const siteJsonLd = jsonLdScript([organizationJsonLd(), webSiteJsonLd()]);

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
          dangerouslySetInnerHTML={{ __html: siteJsonLd }}
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
