import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authenticate } from "@/lib/api-auth";
import {
  deleteJobByExternalId,
  getJobByExternalId,
  parseJobInput,
  upsertJobByExternalId,
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ externalId: string }> };

/** Read back a single record so the ERP can verify what the site holds. */
export async function GET(request: Request, { params }: Params) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { externalId } = await params;
  const job = getJobByExternalId(externalId);
  if (!job) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ job: { ...job, url: `/carrieres/${job.slug}` } });
}

/**
 * Create or update a posting, keyed by the ERP's own identifier.
 * Idempotent: sending the same payload twice leaves one record.
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

  const input = parseJobInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "A non-empty 'title' is required." },
      { status: 422 }
    );
  }

  try {
    const { job, created } = upsertJobByExternalId(externalId, input);
    revalidatePath("/carrieres");
    revalidatePath(`/carrieres/${job.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json(
      {
        created,
        job: { ...job, url: `/carrieres/${job.slug}` },
      },
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
    const job = getJobByExternalId(externalId);
    if (!deleteJobByExternalId(externalId)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    revalidatePath("/carrieres");
    if (job) revalidatePath(`/carrieres/${job.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ deleted: true, externalId });
  } catch {
    return NextResponse.json(
      { error: "Storage is not writable." },
      { status: 503 }
    );
  }
}
