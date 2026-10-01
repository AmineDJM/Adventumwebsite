import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { erpLinked } from "@/lib/erp";
import { deleteJob, parseJobInput, updateJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Linked to the ERP, the site's postings are the ERP's: this admin only shows them. */
function managedByErp(): NextResponse | null {
  if (!erpLinked()) return null;
  return NextResponse.json(
    { error: "This site is linked to the ERP: job postings are created, edited and deleted there (Site web module)." },
    { status: 409 }
  );
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const refused = managedByErp();
  if (refused) return refused;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input = parseJobInput(body);
  if (!input) {
    return NextResponse.json({ error: "A job title is required." }, { status: 422 });
  }

  try {
    const job = updateJob(id, input);
    if (!job) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json(
      { error: "Could not save — the data directory is not writable." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const refused = managedByErp();
  if (refused) return refused;
  const { id } = await params;

  try {
    if (!deleteJob(id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete — the data directory is not writable." },
      { status: 500 }
    );
  }
}
