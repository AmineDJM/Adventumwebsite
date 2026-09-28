import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getAllErpPosts } from "@/lib/erp-posts";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

/**
 * Lists articles the ERP owns, plus a read-only view of the ones committed
 * as Markdown files, so the ERP can tell what it controls from what it
 * does not.
 */
export async function GET(request: Request) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const erp = getAllErpPosts();
  const files = getAllPosts().filter((p) => p.source === "file");

  return NextResponse.json({
    count: erp.length,
    posts: erp.map((p) => ({
      externalId: p.externalId,
      slug: p.slug,
      url: `/blog/${p.slug}`,
      title: p.title,
      description: p.description,
      category: p.category,
      tags: p.tags,
      author: p.author,
      date: p.date,
      updated: p.updated ?? null,
      featured: p.featured,
      published: p.published,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    // Editorial articles in the repository. Read-only for the ERP: an ERP
    // record sharing one of these slugs is ignored on the public site.
    readOnlyFileArticles: files.map((p) => ({
      slug: p.slug,
      url: `/blog/${p.slug}`,
      title: p.title,
      date: p.date,
    })),
  });
}
