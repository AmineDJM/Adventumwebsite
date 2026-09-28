import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import T from "@/components/ui/T";
import { getJobBySlug } from "@/lib/jobs";
import {
  ADDRESS,
  CAREERS_EMAIL,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};

  const title = `${job.title} — ${job.location}`;
  return {
    title,
    description: job.summary,
    alternates: { canonical: `/carrieres/${job.slug}` },
    openGraph: {
      type: "article",
      url: absoluteUrl(`/carrieres/${job.slug}`),
      title: `${title} · ${SITE_NAME}`,
      description: job.summary,
      siteName: SITE_NAME,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: job.summary,
      images: ["/og.png"],
    },
  };
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="relative pl-6 text-sm leading-relaxed text-silver md:text-[0.95rem]"
        >
          <span
            aria-hidden
            className="absolute left-1 top-[0.6em] h-1 w-1 rounded-full bg-bio/70"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function JobPage({ params }: Params) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  // Google for Jobs reads this: a well-formed JobPosting puts the opening
  // directly into Google's jobs experience.
  const description = [
    `<p>${job.summary}</p>`,
    job.mission.length
      ? `<p><strong>Votre mission</strong></p><ul>${job.mission
          .map((m) => `<li>${m}</li>`)
          .join("")}</ul>`
      : "",
    job.profile.length
      ? `<p><strong>Votre profil</strong></p><ul>${job.profile
          .map((m) => `<li>${m}</li>`)
          .join("")}</ul>`
      : "",
    job.offer.length
      ? `<p><strong>Ce que nous offrons</strong></p><ul>${job.offer
          .map((m) => `<li>${m}</li>`)
          .join("")}</ul>`
      : "",
  ].join("");

  // Postings stay valid for a year from publication unless replaced.
  const validThrough = new Date(
    +new Date(job.createdAt) + 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  const jsonLd = jsonLdScript([
    {
      "@type": "JobPosting",
      "@id": `${absoluteUrl(`/carrieres/${job.slug}`)}#job`,
      title: job.title,
      description,
      datePosted: job.createdAt,
      validThrough,
      employmentType: /cdd/i.test(job.type)
        ? "TEMPORARY"
        : /stage|intern/i.test(job.type)
        ? "INTERN"
        : "FULL_TIME",
      industry: "Pharmaceutical",
      occupationalCategory: job.department,
      experienceRequirements: job.experience || undefined,
      directApply: true,
      hiringOrganization: { "@id": `${absoluteUrl("/")}#organization` },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: ADDRESS.street,
          addressLocality: ADDRESS.locality,
          addressRegion: ADDRESS.region,
          postalCode: ADDRESS.postalCode,
          addressCountry: ADDRESS.country,
        },
      },
      applicantLocationRequirements: {
        "@type": "Country",
        name: "Algeria",
      },
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Carrières", path: "/carrieres" },
      { name: job.title, path: `/carrieres/${job.slug}` },
    ]),
  ]);

  const applyHref = `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(
    `Candidature — ${job.title}`
  )}`;

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <article className="section-pad">
        <div className="shell">
          <nav
            aria-label="Fil d'Ariane"
            className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted"
          >
            <Link href="/" className="transition-colors hover:text-frost">
              Adventum
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <Link href="/carrieres" className="transition-colors hover:text-frost">
              <T k="nav.careers" />
            </Link>
          </nav>

          <header className="mt-8 max-w-3xl">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-pulse">
              {job.department}
            </p>
            <h1 className="mt-5 font-display text-display-lg font-medium text-frost">
              {job.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-silver md:text-lg">
              {job.summary}
            </p>

            <dl className="mt-8 flex flex-wrap gap-2.5">
              {[
                { label: "careers.location", value: job.location },
                { label: "careers.type", value: job.type },
                { label: "careers.experience", value: job.experience },
              ]
                .filter((x) => x.value)
                .map((x) => (
                  <div
                    key={x.label}
                    className="rounded-full border border-hairline/10 bg-surface/[0.04] px-4 py-2"
                  >
                    <dt className="inline font-mono text-[0.55rem] uppercase tracking-[0.2em] text-muted">
                      <T k={x.label} />
                    </dt>
                    <dd className="ml-2 inline text-sm text-frost">{x.value}</dd>
                  </div>
                ))}
            </dl>

            <a
              href={applyHref}
              className="mt-9 inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
            >
              <T k="careers.apply_cta" />
            </a>
          </header>

          <div className="mt-16 max-w-3xl space-y-14">
            {job.mission.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-medium text-frost md:text-2xl">
                  <T k="careers.mission_heading" />
                </h2>
                <Bullets items={job.mission} />
              </section>
            )}
            {job.profile.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-medium text-frost md:text-2xl">
                  <T k="careers.profile_heading" />
                </h2>
                <Bullets items={job.profile} />
              </section>
            )}
            {job.offer.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-medium text-frost md:text-2xl">
                  <T k="careers.offer_heading" />
                </h2>
                <Bullets items={job.offer} />
              </section>
            )}
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-6">
            <a
              href={applyHref}
              className="inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
            >
              <T k="careers.apply_cta" />
            </a>
            <Link
              href="/carrieres"
              className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-pulse transition-colors hover:text-frost"
            >
              ← <T k="careers.back_to_careers" />
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
