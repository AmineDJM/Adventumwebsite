import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Job postings store.
 *
 * Backed by a JSON file so the site needs no database to run. NOTE for
 * deployment: container filesystems are ephemeral — on Render, attach a
 * persistent disk mounted at the directory below (or set JOBS_DATA_DIR to
 * it) so postings created from the admin survive restarts and deploys.
 */

const DATA_DIR = process.env.JOBS_DATA_DIR ?? path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "jobs.json");
const SEED_FILE = path.join(process.cwd(), "data", "jobs.seed.json");

export type Job = {
  id: string;
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
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobInput = Omit<Job, "id" | "slug" | "createdAt" | "updatedAt">;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function readRaw(): Job[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Job[];
    }
    // First boot: fall back to the committed seed so the page is never empty.
    if (fs.existsSync(SEED_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as Job[];
    }
  } catch {
    /* corrupt or unreadable — fall through to an empty list */
  }
  return [];
}

function writeRaw(jobs: Job[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2), "utf8");
}

function uniqueSlug(title: string, jobs: Job[], selfId?: string): string {
  const base = slugify(title) || "poste";
  let slug = base;
  let n = 2;
  while (jobs.some((j) => j.slug === slug && j.id !== selfId)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Every posting, newest first (admin view). */
export function getAllJobs(): Job[] {
  return readRaw().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** Published postings only (public view). */
export function getPublishedJobs(): Job[] {
  return getAllJobs().filter((j) => j.published);
}

export function getJobBySlug(slug: string): Job | null {
  return getPublishedJobs().find((j) => j.slug === slug) ?? null;
}

export function createJob(input: JobInput): Job {
  const jobs = readRaw();
  const now = new Date().toISOString();
  const job: Job = {
    ...input,
    id: crypto.randomUUID(),
    slug: uniqueSlug(input.title, jobs),
    createdAt: now,
    updatedAt: now,
  };
  writeRaw([job, ...jobs]);
  return job;
}

export function updateJob(id: string, input: JobInput): Job | null {
  const jobs = readRaw();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const updated: Job = {
    ...jobs[idx],
    ...input,
    slug: uniqueSlug(input.title, jobs, id),
    updatedAt: new Date().toISOString(),
  };
  jobs[idx] = updated;
  writeRaw(jobs);
  return updated;
}

export function deleteJob(id: string): boolean {
  const jobs = readRaw();
  const next = jobs.filter((j) => j.id !== id);
  if (next.length === jobs.length) return false;
  writeRaw(next);
  return true;
}

/** Coerce untrusted request bodies into a JobInput. */
export function parseJobInput(body: unknown): JobInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const str = (v: unknown, max = 200) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const list = (v: unknown) =>
    Array.isArray(v)
      ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
      : typeof v === "string"
      ? v.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 30)
      : [];

  const title = str(b.title, 160);
  if (!title) return null;

  return {
    title,
    department: str(b.department, 120),
    location: str(b.location, 120),
    type: str(b.type, 60),
    experience: str(b.experience, 120),
    summary: str(b.summary, 600),
    mission: list(b.mission),
    profile: list(b.profile),
    offer: list(b.offer),
    published: Boolean(b.published),
  };
}
