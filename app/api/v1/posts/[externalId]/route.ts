import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authenticate } from "@/lib/api-auth";
import {
  deleteErpPost,
  getErpPostByExternalId,
  parseErpPostInput,
  upsertErpPost,
} from "@/lib/erp-posts";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ externalId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { externalId } = await params;
  const post = getErpPostByExternalId(externalId);
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ post: { ...post, url: `/blog/${post.slug}` } });
}

/**
 * Create or update an article, keyed by the ERP's own identifier.
 * The body is Markdown; `##` headings become the article's table of
 * contents and reading time is computed on the site.
 */
export async function PUT(request: Request, { params }: Params) {
  const raw = await request.text();
  const auth = authenticate(request, raw);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { externalId } = await params;
  if (!externalId || externalId.length > 128) {
    return NextResponse.json(
      { error: "externalId must be 1–128 characters." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const input = parseErpPostInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Both a non-empty 'title' and a non-empty 'body' are required." },
      { status: 422 }
    );
  }

  try {
    const { post, created } = upsertErpPost(externalId, input);
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    return NextResponse.json(
      { created, post: { ...post, url: `/blog/${post.slug}` } },
      { status: created ? 201 : 200 }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Storage is not writable. Attach a persistent disk and set JOBS_DATA_DIR.",
      },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { externalId } = await params;

  try {
    const post = getErpPostByExternalId(externalId);
    if (!deleteErpPost(externalId)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    revalidatePath("/blog");
    if (post) revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    return NextResponse.json({ deleted: true, externalId });
  } catch {
    return NextResponse.json(
      { error: "Storage is not writable." },
      { status: 503 }
    );
  }
}
