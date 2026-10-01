import fs from "node:fs";
import path from "node:path";
import { dataDir, writeJsonAtomic } from "@/lib/storage";
import { validFileSlug } from "@/lib/replaced-files";

/**
 * Store for blog articles pushed by the ERP.
 *
 * The blog has two sources that are merged at read time:
 *   1. Markdown files in content/blog — editorial, version-controlled.
 *   2. This JSON store — records pushed by the ERP over /api/v1/posts.
 *
 * Keeping them separate means the ERP can never overwrite a committed
 * article by accident, and the site still has content if the store is empty.
 * The one deliberate exception is a TAKEOVER: a record pushed with
 * `replacesFile` is the ERP's version of that repository article, and it is
 * the one the blog shows (lib/replaced-files.ts).
 */

const dataFile = () => path.join(dataDir().dir, "posts.json");

export type ErpPost = {
  /** Stable id owned by the ERP; the idempotency key for upserts. */
  externalId: string;
  slug: string;
  title: string;
  description: string;
  /** Markdown body. */
  body: string;
  category: string;
  tags: string[];
  author: string;
  /** Publication date, ISO. */
  date: string;
  updated?: string;
  featured: boolean;
  published: boolean;
  /**
   * The repository article (its slug) this record takes over. Set, the file
   * is never shown again — published or not, this record IS that article.
   */
  replacesFile?: string;
  createdAt: string;
  updatedAt: string;
};

export type ErpPostInput = Omit<
  ErpPost,
  "externalId" | "createdAt" | "updatedAt"
>;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96);
}

function readRaw(): ErpPost[] {
  try {
    const file = dataFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as ErpPost[];
    }
  } catch {
    /* unreadable or corrupt — behave as if empty */
  }
  return [];
}

function writeRaw(posts: ErpPost[]): void {
  writeJsonAtomic(dataFile(), posts);
}

export function getAllErpPosts(): ErpPost[] {
  return readRaw();
}

export function getPublishedErpPosts(): ErpPost[] {
  return readRaw().filter((p) => p.published);
}

export function getErpPostByExternalId(externalId: string): ErpPost | null {
  return readRaw().find((p) => p.externalId === externalId) ?? null;
}

export function upsertErpPost(
  externalId: string,
  input: ErpPostInput
): { post: ErpPost; created: boolean } {
  const posts = readRaw();
  const idx = posts.findIndex((p) => p.externalId === externalId);
  const now = new Date().toISOString();

  // Keep slugs unique across ERP records; collisions with a Markdown file
  // are resolved at read time (files win).
  const base = input.slug || slugify(input.title) || "article";
  let slug = base;
  let n = 2;
  while (posts.some((p) => p.slug === slug && p.externalId !== externalId)) {
    slug = `${base}-${n++}`;
  }

  if (idx === -1) {
    const post: ErpPost = {
      ...input,
      slug,
      externalId,
      createdAt: now,
      updatedAt: now,
    };
    writeRaw([post, ...posts]);
    return { post, created: true };
  }

  const post: ErpPost = {
    ...posts[idx],
    ...input,
    slug,
    externalId,
    updatedAt: now,
  };
  posts[idx] = post;
  writeRaw(posts);
  return { post, created: false };
}

export function deleteErpPost(externalId: string): boolean {
  const posts = readRaw();
  const next = posts.filter((p) => p.externalId !== externalId);
  if (next.length === posts.length) return false;
  writeRaw(next);
  return true;
}

/** Coerce an untrusted request body into an ErpPostInput. */
export function parseErpPostInput(body: unknown): ErpPostInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const str = (v: unknown, max = 300) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const title = str(b.title, 200);
  const content = typeof b.body === "string" ? b.body : "";
  if (!title || !content.trim()) return null;

  const isoOrNow = (v: unknown) => {
    if (typeof v !== "string" || !v.trim()) return new Date().toISOString();
    const d = new Date(v);
    return Number.isNaN(+d) ? new Date().toISOString() : d.toISOString();
  };

  return {
    slug: str(b.slug, 96) ? slugify(str(b.slug, 96)) : slugify(title),
    title,
    description: str(b.description, 400),
    body: content.slice(0, 200_000),
    category: str(b.category, 80) || "Secteur",
    tags: Array.isArray(b.tags)
      ? b.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
      : [],
    author: str(b.author, 120) || "Adventum Pharma",
    date: isoOrNow(b.date),
    updated:
      typeof b.updated === "string" && b.updated.trim()
        ? isoOrNow(b.updated)
        : undefined,
    featured: Boolean(b.featured),
    // Absent "published" defaults to true: an ERP that pushes an article is
    // publishing it. Send published:false explicitly to stage a draft.
    published: b.published === undefined ? true : Boolean(b.published),
    // Only a well-formed repository slug is accepted: anything else is
    // ignored rather than allowed to hide a file by accident.
    ...(validFileSlug(b.replacesFile) ? { replacesFile: validFileSlug(b.replacesFile)! } : {}),
  };
}

/**
 * Replace the whole store with the ERP's list in one write — used when the
 * site reloads its content at start-up. Every record here comes from the
 * ERP, so the ERP's list IS the store. Existing records keep their creation
 * date; slugs stay unique among ERP records (committed files still win at
 * read time).
 */
export function replaceErpPosts(
  items: { externalId: string; input: ErpPostInput }[],
  /** When the reload started: a record the ERP pushed AFTER that is newer than the list, and wins. */
  since: string
): { written: number; removed: number } {
  const current = readRaw();
  const byExternal = new Map(current.map((p) => [p.externalId, p] as const));
  const now = new Date().toISOString();
  const next: ErpPost[] = current.filter((p) => p.updatedAt > since);
  const pushedMeanwhile = new Set(next.map((p) => p.externalId));
  for (const { externalId, input } of items) {
    if (pushedMeanwhile.has(externalId)) continue;
    const base = input.slug || slugify(input.title) || "article";
    let slug = base;
    let n = 2;
    while (next.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
    const existing = byExternal.get(externalId);
    next.push({ ...(existing ?? {}), ...input, slug, externalId, createdAt: existing?.createdAt ?? now, updatedAt: now });
  }
  const wanted = new Set([...items.map((i) => i.externalId), ...pushedMeanwhile]);
  const removed = current.filter((p) => !wanted.has(p.externalId)).length;
  writeRaw(next);
  return { written: next.length, removed };
}
