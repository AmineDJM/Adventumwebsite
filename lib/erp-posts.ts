import fs from "node:fs";
import path from "node:path";

/**
 * Store for blog articles pushed by the ERP.
 *
 * The blog has two sources that are merged at read time:
 *   1. Markdown files in content/blog — editorial, version-controlled.
 *   2. This JSON store — records pushed by the ERP over /api/v1/posts.
 *
 * Keeping them separate means the ERP can never overwrite a committed
 * article, and the site still has content if the store is empty.
 */

const DATA_DIR = process.env.JOBS_DATA_DIR ?? path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "posts.json");

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
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as ErpPost[];
    }
  } catch {
    /* unreadable or corrupt — behave as if empty */
  }
  return [];
}

function writeRaw(posts: ErpPost[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
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
  };
}
