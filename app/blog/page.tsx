import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeading from "@/components/ui/PageHeading";
import T from "@/components/ui/T";
import { getAllPosts, formatDate } from "@/lib/blog";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/site";

const TITLE = "Actualités & analyses du secteur pharmaceutique algérien";
const DESCRIPTION =
  "Analyses et repères pratiques sur l'industrie pharmaceutique en Algérie : réglementation, enregistrement des médicaments, qualité, appels d'offres et distribution institutionnelle.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blog"),
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

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const jsonLd = jsonLdScript([
    {
      "@type": "Blog",
      "@id": `${SITE_URL}/blog#blog`,
      url: absoluteUrl("/blog"),
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "fr",
      publisher: { "@id": `${SITE_URL}/#organization` },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        url: absoluteUrl(`/blog/${p.slug}`),
        datePublished: p.date,
        dateModified: p.updated ?? p.date,
        author: { "@type": "Organization", name: p.author },
      })),
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Actualités", path: "/blog" },
    ]),
  ]);

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <section className="section-pad">
        <div className="shell">
          <PageHeading
            eyebrowKey="blog.eyebrow"
            titleKey="blog.title"
            subKey="blog.sub"
          />

          {posts.length === 0 ? (
            <p className="mt-16 text-silver">
              <T k="blog.empty" />
            </p>
          ) : (
            <>
              {/* lead article */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mt-14 block rounded-3xl glass card-shadow p-8 transition-colors duration-500 ease-premium hover:bg-surface/[0.03] md:mt-20 md:p-12"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-pulse">
                    {featured.category}
                  </p>
                  <h2 className="mt-5 font-display text-2xl font-medium text-frost transition-colors group-hover:text-gradient-bio md:text-4xl">
                    {featured.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver md:text-base">
                    {featured.description}
                  </p>
                  <p className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted">
                    <time dateTime={featured.date}>
                      {formatDate(featured.date)}
                    </time>
                    <span aria-hidden>·</span>
                    <span>
                      {featured.readingTime} <T k="blog.reading_time" />
                    </span>
                  </p>
                </Link>
              )}

              {/* the rest */}
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col rounded-2xl glass p-7 transition-colors duration-500 ease-premium hover:bg-surface/[0.03]"
                  >
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-pulse">
                      {post.category}
                    </p>
                    <h3 className="mt-4 font-display text-lg font-medium leading-snug text-frost md:text-xl">
                      {post.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-silver">
                      {post.description}
                    </p>
                    <p className="mt-6 flex flex-wrap items-center gap-2.5 font-mono text-[0.55rem] uppercase tracking-[0.25em] text-muted">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span aria-hidden>·</span>
                      <span>
                        {post.readingTime} <T k="blog.reading_time" />
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
