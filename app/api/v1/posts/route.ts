import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getAllErpPosts } from "@/lib/erp-posts";
import { getAllPosts, replacedFileSlugs } from "@/lib/blog";

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
      // The body is part of PostRecord (docs/openapi.yaml): without it the ERP
      // cannot tell what the site holds, and it re-pushed every article at every
      // reconciliation, believing each one had drifted.
      body: p.body,
      category: p.category,
      tags: p.tags,
      author: p.author,
      date: p.date,
      updated: p.updated ?? null,
      featured: p.featured,
      published: p.published,
      replacesFile: p.replacesFile ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    // Editorial articles in the repository that are still SHOWN. Read-only
    // for the ERP: an ERP record merely sharing one of these slugs is
    // ignored on the public site (it has to take the file over instead).
    readOnlyFileArticles: files.map((p) => ({
      slug: p.slug,
      url: `/blog/${p.slug}`,
      title: p.title,
      date: p.date,
    })),
    // Repository articles the ERP has taken over: never shown again as files.
    replacedFiles: [...replacedFileSlugs()].sort(),
  });
}
