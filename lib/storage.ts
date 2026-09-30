import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Where the site writes its runtime data (jobs, ERP articles, applications
 * waiting to be delivered).
 *
 * The configured directory (JOBS_DATA_DIR) is meant to be a persistent disk.
 * Render's free plan has no disk, and a directory that cannot be written made
 * every ERP push fail with "Storage is not writable" — the site looked broken
 * while only the disk was missing. So the directory is PROBED once, and the
 * site falls back to one it can write:
 *
 *   1. JOBS_DATA_DIR (when set),
 *   2. ./data (the working directory),
 *   3. the OS temporary directory.
 *
 * A fallback is not silent: /api/v1/health reports it, and the ERP shows it.
 * Nothing is lost by it either — on every start the site reloads its jobs and
 * articles from the ERP (lib/erp-sync.ts), which is the source of truth.
 */

export type DataDir = {
  /** The directory actually used. */
  dir: string;
  /** The directory that was asked for (JOBS_DATA_DIR, or ./data). */
  requested: string;
  /** True when `dir` is not the requested directory. */
  fallback: boolean;
};

type Holder = { __adventumDataDir?: DataDir };

function writable(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

export function dataDir(): DataDir {
  const g = globalThis as Holder;
  if (g.__adventumDataDir) return g.__adventumDataDir;
  const configured = process.env.JOBS_DATA_DIR?.trim();
  const local = path.join(process.cwd(), "data");
  const candidates = [configured, local, path.join(os.tmpdir(), "adventum-data")].filter(
    (d): d is string => Boolean(d)
  );
  const requested = candidates[0]!;
  const dir = candidates.find(writable) ?? requested;
  const result: DataDir = { dir, requested, fallback: dir !== requested };
  if (result.fallback) {
    console.warn(`[storage] ${requested} is not writable — using ${dir} instead.`);
  }
  g.__adventumDataDir = result;
  return result;
}

/** Atomic write: a crash mid-write must not leave half a JSON file behind. */
export function writeJsonAtomic(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}
