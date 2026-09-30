import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, writeJsonAtomic } from "@/lib/storage";
import { erpLinked } from "@/lib/erp";

/**
 * Job postings store.
 *
 * Backed by a JSON file so the site needs no database to run. The directory
 * comes from lib/storage.ts, which falls back to a writable one when the
 * configured disk is missing. Container filesystems are ephemeral: when the
 * site is linked to the ERP, it reloads the ERP's postings on every start
 * (lib/erp-sync.ts), so a restart loses nothing the ERP published.
 */

const dataFile = () => path.join(dataDir().dir, "jobs.json");
const SEED_FILE = path.join(process.cwd(), "data", "jobs.seed.json");

export type Job = {
  id: string;
  /** Stable id owned by the ERP; the idempotency key for upserts. */
  externalId?: string;
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

export type JobInput = Omit<
  Job,
  "id" | "externalId" | "slug" | "createdAt" | "updatedAt"
>;

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
    const file = dataFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as Job[];
    }
    // First boot of an UNLINKED site: the committed seed keeps the page from
    // looking empty. A site linked to the ERP never shows it — sample
    // openings would draw real applications for positions that do not exist.
    if (!erpLinked() && fs.existsSync(SEED_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as Job[];
    }
  } catch {
    /* corrupt or unreadable — fall through to an empty list */
  }
  return [];
}

function writeRaw(jobs: Job[]): void {
  writeJsonAtomic(dataFile(), jobs);
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


/* ------------------------------------------------------------------ */
/*  ERP-facing operations — keyed by externalId so repeated pushes of   */
/*  the same record update it instead of creating duplicates.          */
/* ------------------------------------------------------------------ */

export function getJobByExternalId(externalId: string): Job | null {
  return readRaw().find((j) => j.externalId === externalId) ?? null;
}

export function upsertJobByExternalId(
  externalId: string,
  input: JobInput
): { job: Job; created: boolean } {
  const jobs = readRaw();
  const idx = jobs.findIndex((j) => j.externalId === externalId);
  const now = new Date().toISOString();

  if (idx === -1) {
    const job: Job = {
      ...input,
      id: crypto.randomUUID(),
      externalId,
      slug: uniqueSlug(input.title, jobs),
      createdAt: now,
      updatedAt: now,
    };
    writeRaw([job, ...jobs]);
    return { job, created: true };
  }

  const job: Job = {
    ...jobs[idx],
    ...input,
    externalId,
    slug: uniqueSlug(input.title, jobs, jobs[idx].id),
    updatedAt: now,
  };
  jobs[idx] = job;
  writeRaw(jobs);
  return { job, created: false };
}

export function deleteJobByExternalId(externalId: string): boolean {
  const jobs = readRaw();
  const next = jobs.filter((j) => j.externalId !== externalId);
  if (next.length === jobs.length) return false;
  writeRaw(next);
  return true;
}

/**
 * Replace every ERP-managed posting with the ERP's list in one write — used
 * when the site reloads its content at start-up. Postings created in this
 * site's own admin (no externalId) are kept untouched. Existing records keep
 * their id, slug and creation date, so links already shared stay valid.
 */
export function replaceErpJobs(
  items: { externalId: string; input: JobInput }[],
  /** When the reload started: a record the ERP pushed AFTER that is newer than the list, and wins. */
  since: string
): { kept: number; written: number; removed: number } {
  const current = readRaw();
  const manual = current.filter((j) => !j.externalId);
  const fresher = current.filter((j) => j.externalId && j.updatedAt > since);
  const byExternal = new Map(current.filter((j) => j.externalId).map((j) => [j.externalId!, j] as const));
  const now = new Date().toISOString();
  const next: Job[] = [...manual, ...fresher];
  const pushedMeanwhile = new Set(fresher.map((j) => j.externalId!));
  for (const { externalId, input } of items) {
    if (pushedMeanwhile.has(externalId)) continue;
    const existing = byExternal.get(externalId);
    const job: Job = existing
      ? { ...existing, ...input, externalId, slug: uniqueSlug(input.title, next, existing.id), updatedAt: now }
      : { ...input, id: crypto.randomUUID(), externalId, slug: uniqueSlug(input.title, next), createdAt: now, updatedAt: now };
    next.push(job);
  }
  const wanted = new Set([...items.map((i) => i.externalId), ...pushedMeanwhile]);
  const removed = [...byExternal.keys()].filter((k) => !wanted.has(k)).length;
  writeRaw(next);
  return { kept: manual.length, written: items.length, removed };
}
