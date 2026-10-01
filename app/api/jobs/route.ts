import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { erpLinked } from "@/lib/erp";
import {
  createJob,
  getAllJobs,
  getPublishedJobs,
  parseJobInput,
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Linked to the ERP, the site's postings are the ERP's: this admin only shows them. */
function managedByErp(): NextResponse | null {
  if (!erpLinked()) return null;
  return NextResponse.json(
    { error: "This site is linked to the ERP: job postings are created, edited and deleted there (Site web module)." },
    { status: 409 }
  );
}

/** Published postings are public; the full list requires a session. */
export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ jobs: authed ? getAllJobs() : getPublishedJobs() });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const refused = managedByErp();
  if (refused) return refused;

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
    return NextResponse.json({ job: createJob(input) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save — the data directory is not writable." },
      { status: 500 }
    );
  }
}
