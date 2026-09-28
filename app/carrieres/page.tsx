import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/ui/PageHeading";
import T from "@/components/ui/T";
import { getPublishedJobs } from "@/lib/jobs";
import {
  CAREERS_EMAIL,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/site";

// Postings are managed from the admin at runtime, so this page must not be
// frozen at build time.
export const dynamic = "force-dynamic";

const TITLE = "Carrières — Recrutement pharmaceutique en Algérie";
const DESCRIPTION =
  "Rejoignez Adventum Pharma, laboratoire pharmaceutique algérien basé à Alger. Offres d'emploi en affaires réglementaires, assurance qualité, supply chain et accès au marché.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/carrieres" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/carrieres"),
    title: `${TITLE} · ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

const VALUES = [
  { t: "careers.value1_title", b: "careers.value1_body" },
  { t: "careers.value2_title", b: "careers.value2_body" },
  { t: "careers.value3_title", b: "careers.value3_body" },
];

export default function CareersPage() {
  const jobs = getPublishedJobs();

  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Carrières", path: "/carrieres" },
    ]),
    {
      "@type": "CollectionPage",
      url: absoluteUrl("/carrieres"),
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "fr",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    },
  ]);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <section className="section-pad">
        <div className="shell">
          <PageHeading
            eyebrowKey="careers.eyebrow"
            titleKey="careers.title"
            subKey="careers.sub"
          />

          {/* values */}
          <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-6">
            {VALUES.map((v) => (
              <div key={v.t} className="rounded-2xl glass p-7">
                <h2 className="font-display text-lg font-medium text-frost">
                  <T k={v.t} />
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-silver">
                  <T k={v.b} />
                </p>
              </div>
            ))}
          </div>

          {/* openings */}
          <h2 className="mt-20 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
            <T k="careers.open_positions" />
          </h2>

          {jobs.length === 0 ? (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-silver">
              <T k="careers.no_positions" />
            </p>
          ) : (
            <ul className="mt-7 space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/carrieres/${job.slug}`}
                    className="group flex flex-col gap-5 rounded-2xl glass p-7 transition-colors duration-500 ease-premium hover:bg-surface/[0.03] md:flex-row md:items-center md:justify-between md:p-8"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-pulse">
                        {job.department}
                      </p>
                      <h3 className="mt-3 font-display text-xl font-medium text-frost md:text-2xl">
                        {job.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver">
                        {job.summary}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      {[job.location, job.type, job.experience]
                        .filter(Boolean)
                        .map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-hairline/10 bg-surface/[0.04] px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-silver"
                          >
                            {chip}
                          </span>
                        ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* spontaneous application */}
          <div className="mt-16 rounded-3xl glass card-shadow p-8 md:p-12">
            <h2 className="font-display text-2xl font-medium text-frost">
              <T k="careers.spontaneous_heading" />
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver md:text-base">
              <T k="careers.spontaneous_body" />
            </p>
            <a
              href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(
                "Candidature spontanée"
              )}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
            >
              <T k="careers.spontaneous_cta" />
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
