/**
 * Single source of truth for everything the SEO layer needs: canonical
 * origin, brand identity, contact details and the structured-data graph.
 * Metadata, sitemap, robots, RSS and JSON-LD all read from here so the
 * site never contradicts itself.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adventumdz.com"
).replace(/\/$/, "");

export const SITE_NAME = "Adventum Pharma";
export const SITE_LOCALE = "fr_DZ";
export const CONTACT_EMAIL = "Info@adventumdz.com";
export const CAREERS_EMAIL = "Info@adventumdz.com";
export const PHONE = "+213 (0)20 339 430";

export const ADDRESS = {
  street: "Classe 45 GPR PROP 15 N°01, Cheraga",
  locality: "Alger",
  region: "Alger",
  country: "DZ",
  postalCode: "16000",
};

export const DEFAULT_TITLE =
  "Adventum Pharma — Laboratoire pharmaceutique algérien";
export const DEFAULT_DESCRIPTION =
  "Adventum Pharma est un laboratoire pharmaceutique algérien basé à Alger : qualité pharmaceutique, affaires réglementaires, approvisionnement et distribution institutionnelle. Partenaire local des laboratoires internationaux pour le marché algérien.";

/**
 * Keyword set for the sector and the market. Deliberately limited to terms
 * Adventum can legitimately rank for — describing what the company does and
 * where. Third-party brand names are never used here: search engines ignore
 * the keywords meta entirely and treat competitor-name stuffing as spam.
 */
export const DEFAULT_KEYWORDS = [
  "Adventum Pharma",
  "Adventum",
  "laboratoire pharmaceutique algérien",
  "laboratoire pharmaceutique Algérie",
  "industrie pharmaceutique Algérie",
  "société pharmaceutique Alger",
  "pharmaceutique Algérie",
  "enregistrement médicament Algérie",
  "affaires réglementaires pharmaceutiques Algérie",
  "importation pharmaceutique Algérie",
  "distribution pharmaceutique Algérie",
  "appels d'offres pharmaceutiques Algérie",
  "marché hospitalier Algérie",
  "qualité pharmaceutique",
  "pharmacovigilance Algérie",
  "Algerian pharmaceutical company",
  "pharmaceutical laboratory Algeria",
];

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Organization + WebSite graph reused on every page. */
export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: "Adventum Pharma",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
    },
    image: absoluteUrl("/og.png"),
    email: CONTACT_EMAIL,
    telephone: PHONE,
    description: DEFAULT_DESCRIPTION,
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: ADDRESS.locality,
        addressCountry: ADDRESS.country,
      },
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.locality,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.country,
    },
    areaServed: [
      { "@type": "Country", name: "Algeria" },
      { "@type": "Place", name: "North Africa" },
    ],
    knowsAbout: [
      "Pharmaceutical quality assurance",
      "Pharmaceutical regulatory affairs",
      "Drug registration in Algeria",
      "Pharmaceutical importation and distribution",
      "Hospital and institutional market access",
      "Pharmacovigilance",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "business partnerships",
        email: CONTACT_EMAIL,
        telephone: PHONE,
        areaServed: "DZ",
        availableLanguage: ["fr", "en", "ar"],
      },
    ],
  };
}

export function webSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["fr", "en", "hi", "zh"],
  };
}

/** Breadcrumb trail helper — used by article and job pages. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Serialize a @graph document for a <script type="application/ld+json">. */
export function jsonLdScript(nodes: unknown[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
