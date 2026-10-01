import fs from "node:fs";
import path from "node:path";
import { dataDir, writeJsonAtomic } from "@/lib/storage";

/**
 * Repository articles the ERP has TAKEN OVER — and must never be shown again.
 *
 * The five articles committed in content/blog were the site's own. Since the
 * ERP became the place where the company writes, it takes each of them over:
 * it creates its own record with the same address (slug) and pushes it with
 * `replacesFile: "<slug>"`. From then on the ERP's version IS the article —
 * edited, withdrawn or deleted from the ERP, like any other.
 *
 * Deleting it is the one case the pushed record cannot cover: once the ERP
 * record is gone, nothing would say the file is superseded, and the old
 * repository version would come back. So the slug is remembered here — as a
 * tombstone — when the ERP deletes a record that replaced a file, and the ERP
 * sends its full list again on every restore (`replacedFiles` in
 * GET /api/site-web/v1/contenus). The ERP is the source of truth: a restore
 * REPLACES this list, it never merges into it.
 */

const dataFile = () => path.join(dataDir().dir, "replaced-files.json");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A repository slug, as the ERP may name it: lower-case words joined by single hyphens. */
export function validFileSlug(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 && s.length <= 96 && SLUG.test(s) ? s : null;
}

function readRaw(): string[] {
  try {
    const file = dataFile();
    if (fs.existsSync(file)) {
      const v = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
      if (Array.isArray(v)) return v.map(validFileSlug).filter((s): s is string => s !== null);
    }
  } catch {
    /* unreadable — behave as if empty: the next restore rewrites it */
  }
  return [];
}

export function getReplacedFileSlugs(): Set<string> {
  return new Set(readRaw());
}

/** The ERP deleted a record that had replaced this file: the file stays hidden. */
export function addReplacedFileSlug(slug: string): void {
  const s = validFileSlug(slug);
  if (!s) return;
  const current = readRaw();
  if (current.includes(s)) return;
  writeJsonAtomic(dataFile(), [...current, s].sort());
}

/** The ERP's full list, at restore — it replaces whatever was here. */
export function setReplacedFileSlugs(slugs: readonly unknown[]): number {
  const clean = [...new Set(slugs.map(validFileSlug).filter((s): s is string => s !== null))].sort();
  writeJsonAtomic(dataFile(), clean);
  return clean.length;
}
