import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import {
  createJob,
  getAllJobs,
  getPublishedJobs,
  parseJobInput,
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Published postings are public; the full list requires a session. */
export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ jobs: authed ? getAllJobs() : getPublishedJobs() });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
