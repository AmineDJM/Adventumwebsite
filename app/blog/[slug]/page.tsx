import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import T from "@/components/ui/T";
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
  formatDate,
} from "@/lib/blog";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: SITE_NAME,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/og.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug);
  const url = absoluteUrl(`/blog/${post.slug}`);

  const jsonLd = jsonLdScript([
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.description,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      inLanguage: "fr",
      keywords: post.tags.join(", "),
      articleSection: post.category,
      wordCount: post.readingTime * 200,
      image: [absoluteUrl("/og.png")],
      author: {
        "@type": "Organization",
        name: post.author,
        url: absoluteUrl("/"),
      },
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Actualités", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ]);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <article className="section-pad">
        <div className="shell">
          {/* breadcrumb */}
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
            <Link href="/blog" className="transition-colors hover:text-frost">
              <T k="nav.blog" />
            </Link>
          </nav>

          {/* header */}
          <header className="mt-8 max-w-3xl">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-pulse">
              {post.category}
            </p>
            <h1 className="mt-5 font-display text-display-lg font-medium text-frost">
              {post.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-silver md:text-lg">
              {post.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted">
              <span>{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>
                {post.readingTime} <T k="blog.reading_time" />
              </span>
            </div>
          </header>

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* table of contents */}
            {post.toc.length > 1 && (
              <aside className="lg:order-2 lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted">
                    <T k="blog.toc_heading" />
                  </p>
                  <ul className="mt-5 space-y-2.5 border-l border-hairline/10 pl-4">
                    {post.toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="text-sm leading-snug text-silver transition-colors duration-300 hover:text-frost"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}

            {/* body */}
            <div
              className={`prose-adventum lg:order-1 ${
                post.toc.length > 1 ? "lg:col-span-8" : "lg:col-span-9"
              }`}
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </div>

          {/* conversion block */}
          <aside className="mt-20 rounded-3xl glass card-shadow p-8 md:p-12">
            <h2 className="font-display text-2xl font-medium text-frost">
              <T k="blog.cta_heading" />
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver md:text-base">
              <T k="blog.cta_body" />
            </p>
            <Link
              href="/#contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-bio/40 bg-bio/10 px-6 py-3 text-sm font-semibold text-bio transition-all duration-500 ease-premium hover:border-bio/70 hover:bg-bio/[0.16]"
            >
              <T k="blog.cta_button" />
            </Link>
          </aside>

          {/* related */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                <T k="blog.related_heading" />
              </h2>
              <div className="mt-7 grid gap-5 md:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group flex h-full flex-col rounded-2xl glass p-6 transition-colors duration-500 ease-premium hover:bg-surface/[0.03]"
                  >
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-pulse">
                      {r.category}
                    </p>
                    <h3 className="mt-3 font-display text-base font-medium leading-snug text-frost">
                      {r.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {r.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-16">
            <Link
              href="/blog"
              className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-pulse transition-colors hover:text-frost"
            >
              ← <T k="blog.back_to_blog" />
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
