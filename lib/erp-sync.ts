import crypto from "node:crypto";
import { callErp, erpLinked, erpMessage } from "@/lib/erp";
import { parseErpJobInput, replaceErpJobs, type ErpJobInput } from "@/lib/jobs";
import { parseErpPostInput, replaceErpPosts, type ErpPostInput } from "@/lib/erp-posts";
import { setReplacedFileSlugs } from "@/lib/replaced-files";

/**
 * Keeping the site's content in step with the ERP across restarts.
 *
 * On Render's free plan the site has no disk: whatever the ERP pushed is
 * gone after a restart (and the free plan restarts the site every time it
 * wakes from sleep). The site therefore RELOADS its jobs and articles from
 * the ERP when it starts — GET /api/site-web/v1/contenus, the exact bodies the
 * ERP would push — and pages wait briefly for that reload before reading, so
 * a visitor never sees an empty careers page for a site that has openings.
 *
 * The ERP remains the source of truth: an ERP-managed record that is no
 * longer in its list is removed here. Postings created in this site's own
 * admin are never touched — unless the ERP has taken one over. The reply also
 * carries the repository articles the ERP has taken over (`replacedFiles`):
 * without that list, an article taken over and then DELETED in the ERP would
 * come back from the repository after every restart.
 *
 * State lives on globalThis: instrumentation.ts and the route bundles are
 * separate module graphs in Next.js, and must see the same process state.
 */

export type RestoreResult = {
  ok: boolean;
  at: string;
  jobs: number;
  posts: number;
  error: string | null;
};

type ProcessState = {
  bootId: string;
  startedAt: string;
  restore: Promise<RestoreResult> | null;
  lastRestore: RestoreResult | null;
  lastRestoreAttempt: number;
};

type Holder = { __adventumProcess?: ProcessState };

/** This process: an id that changes on every start, so the ERP can tell. */
export function processState(): ProcessState {
  const g = globalThis as Holder;
  if (!g.__adventumProcess) {
    g.__adventumProcess = {
      bootId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      restore: null,
      lastRestore: null,
      lastRestoreAttempt: 0,
    };
  }
  return g.__adventumProcess;
}

type Wire = { externalId?: unknown } & Record<string, unknown>;

async function restoreOnce(): Promise<RestoreResult> {
  const at = new Date().toISOString();
  const r = await callErp("/api/site-web/v1/contenus", { method: "GET", timeoutMs: 15_000 });
  if (r.status !== 200) return { ok: false, at, jobs: 0, posts: 0, error: erpMessage(r) };
  let j: { jobs?: unknown; posts?: unknown; count?: unknown; replacedFiles?: unknown };
  try {
    j = JSON.parse(r.text ?? "");
  } catch {
    return { ok: false, at, jobs: 0, posts: 0, error: "ERP answered with something that is not JSON." };
  }
  // A reply without BOTH lists is not "the ERP has nothing": replacing on
  // that basis would wipe the site. Refuse it and keep what we have.
  if (!Array.isArray(j.jobs) || !Array.isArray(j.posts)) {
    return { ok: false, at, jobs: 0, posts: 0, error: "ERP answered without the expected lists." };
  }
  const jobs: { externalId: string; input: ErpJobInput }[] = [];
  for (const w of j.jobs as Wire[]) {
    const input = parseErpJobInput(w);
    if (typeof w.externalId === "string" && w.externalId && input) jobs.push({ externalId: w.externalId, input });
  }
  const posts: { externalId: string; input: ErpPostInput }[] = [];
  for (const w of j.posts as Wire[]) {
    const input = parseErpPostInput(w);
    if (typeof w.externalId === "string" && w.externalId && input) posts.push({ externalId: w.externalId, input });
  }
  try {
    replaceErpJobs(jobs, at);
    replaceErpPosts(posts, at);
    // An ERP that predates takeovers sends no list: keep what is here rather than wipe it.
    if (Array.isArray(j.replacedFiles)) setReplacedFileSlugs(j.replacedFiles);
  } catch (e) {
    return { ok: false, at, jobs: 0, posts: 0, error: `Storage error: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true, at, jobs: jobs.length, posts: posts.length, error: null };
}

/**
 * Start (or join) the reload. Idempotent within a process; a failed reload is
 * retried at most every five minutes, so a sleeping ERP is not hammered.
 * `force` (POST /api/v1/resync — the ERP asking) reloads even after a success.
 */
export function startRestore(opts: { force?: boolean } = {}): Promise<RestoreResult> | null {
  if (!erpLinked()) return null;
  const s = processState();
  if (s.restore) return s.restore;
  if (s.lastRestore?.ok && !opts.force) return Promise.resolve(s.lastRestore);
  // A forced reload is still spaced (30 s): the key that can ask for it must not be able to make
  // the site hammer the ERP.
  const gap = opts.force ? 30_000 : 5 * 60_000;
  if (Date.now() - s.lastRestoreAttempt < gap && s.lastRestore) return Promise.resolve(s.lastRestore);
  s.lastRestoreAttempt = Date.now();
  s.restore = restoreOnce()
    .catch((e): RestoreResult => ({ ok: false, at: new Date().toISOString(), jobs: 0, posts: 0, error: String(e) }))
    .then((res) => {
      s.lastRestore = res;
      s.restore = null;
      if (res.ok) console.info(`[erp-sync] reloaded ${res.jobs} job(s) and ${res.posts} article(s) from the ERP`);
      else console.warn(`[erp-sync] reload failed: ${res.error}`);
      return res;
    });
  return s.restore;
}

/**
 * Pages call this before reading jobs or articles: it waits for the start-up
 * reload, but never more than `maxMs` — a slow ERP must not make the site slow.
 */
export async function restoreReady(maxMs = 4_000): Promise<void> {
  const p = startRestore();
  if (!p) return;
  await Promise.race([p.then(() => undefined), new Promise<void>((r) => setTimeout(r, maxMs).unref?.())]);
}
