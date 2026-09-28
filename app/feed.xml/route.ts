import { getAllPosts } from "@/lib/blog";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/** RSS 2.0 feed — lets readers and aggregators follow the Insights section. */
export async function GET() {
  const posts = getAllPosts();

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/blog/${post.slug}`)}</guid>
      <description>${escape(post.description)}</description>
      <category>${escape(post.category)}</category>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(SITE_NAME)} — Actualités</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>Analyses et repères pratiques sur le secteur pharmaceutique en Algérie.</description>
    <language>fr</language>
    <managingEditor>${CONTACT_EMAIL} (${escape(SITE_NAME)})</managingEditor>
    <lastBuildDate>${new Date(
      posts[0]?.updated ?? posts[0]?.date ?? Date.now()
    ).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
