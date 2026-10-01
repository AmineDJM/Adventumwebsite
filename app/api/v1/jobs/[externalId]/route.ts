import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authenticate } from "@/lib/api-auth";
import {
  deleteJobByExternalId,
  deleteManualJob,
  getJobByExternalId,
  parseErpJobInput,
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

  const input = parseErpJobInput(body);
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

/**
 * Delete a posting. The body is usually empty; when the ERP deletes a posting
 * it had TAKEN OVER from this site's admin, it sends `{ "replacesJob": "<id>" }`
 * — signed like any body — so that the admin-typed copy goes too, even if the
 * ERP's version never reached this site.
 */
export async function DELETE(request: Request, { params }: Params) {
  const raw = await request.text();
  const auth = authenticate(request, raw);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { externalId } = await params;

  let named: string | null = null;
  if (raw.trim()) {
    try {
      const v = (JSON.parse(raw) as { replacesJob?: unknown })?.replacesJob;
      named = typeof v === "string" && /^[A-Za-z0-9._~-]{1,128}$/.test(v.trim()) ? v.trim() : null;
    } catch {
      return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
    }
  }

  try {
    const job = getJobByExternalId(externalId);
    const manual = named ? deleteManualJob(named) : null;
    const deleted = deleteJobByExternalId(externalId);
    if (!deleted && !manual) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    revalidatePath("/carrieres");
    if (job) revalidatePath(`/carrieres/${job.slug}`);
    if (manual) revalidatePath(`/carrieres/${manual.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ deleted, externalId, ...(manual ? { replacedJob: manual.id } : {}) });
  } catch {
    return NextResponse.json(
      { error: "Storage is not writable." },
      { status: 503 }
    );
  }
}
