import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getAllJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/** Full posting list, including drafts — lets the ERP reconcile state. */
export async function GET(request: Request) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const jobs = getAllJobs();
  return NextResponse.json({
    count: jobs.length,
    jobs: jobs.map((j) => ({
      externalId: j.externalId ?? null,
      id: j.id,
      slug: j.slug,
      url: `/carrieres/${j.slug}`,
      title: j.title,
      department: j.department,
      location: j.location,
      type: j.type,
      experience: j.experience,
      summary: j.summary,
      mission: j.mission,
      profile: j.profile,
      offer: j.offer,
      published: j.published,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    })),
  });
}
