import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getRepositoryArticles } from "@/lib/blog";

export const dynamic = "force-dynamic";

const SEED_FILE = path.join(process.cwd(), "data", "jobs.seed.json");

type SampleJob = {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  summary: string;
  mission: string[];
  profile: string[];
  offer: string[];
};

const text = (v: unknown): string => (typeof v === "string" ? v : "");
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);

/** The sample openings committed with the site — shown only while it is not linked to the ERP. */
function sampleJobs(): SampleJob[] {
  try {
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((j): j is Record<string, unknown> => Boolean(j) && typeof j === "object")
      .map((j) => ({
        slug: text(j.slug),
        title: text(j.title),
        department: text(j.department),
        location: text(j.location),
        type: text(j.type),
        experience: text(j.experience),
        summary: text(j.summary),
        mission: list(j.mission),
        profile: list(j.profile),
        offer: list(j.offer),
      }))
      .filter((j) => j.slug && j.title);
  } catch {
    return [];
  }
}

/**
 * The content committed IN THIS REPOSITORY — the articles in content/blog and
 * the sample openings — exactly as written, raw Markdown included, so the ERP
 * can take them over (create its own records, edit them, delete them).
 *
 * Read-only: nothing here changes what the site shows. The takeover happens
 * when the ERP pushes its version of an article with `replacesFile`.
 * Authenticated like the rest of the content API (key + signature on "").
 */
export async function GET(request: Request) {
  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json(
    { articles: getRepositoryArticles(), sampleJobs: sampleJobs() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
