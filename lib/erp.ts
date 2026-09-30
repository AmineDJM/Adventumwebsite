import crypto from "node:crypto";

/**
 * The site's link BACK to the ERP.
 *
 * The ERP pushes jobs and articles here (/api/v1/*). This module is the other
 * direction: the site sends the applications it receives to the ERP, and
 * reloads its content from the ERP when it starts.
 *
 * It uses the SAME key and secret the ERP already gave this site
 * (ERP_API_KEY, ERP_WEBHOOK_SECRET) — the ERP generates them and shows them as
 * one block to paste into Render, with ERP_BASE_URL. A second key for the
 * other direction would mean a second block to paste, for no added safety:
 * whoever holds one already holds the right to publish on this site.
 */

const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type ErpConfig = { base: string; key: string; secret: string | null };

/** The ERP link, or null with the reason it is missing. */
export function erpConfig(): { ok: true; config: ErpConfig } | { ok: false; reason: string } {
  const rawBase = (process.env.ERP_BASE_URL ?? "").trim();
  const key = (process.env.ERP_API_KEY ?? "").trim();
  if (!rawBase) return { ok: false, reason: "ERP_BASE_URL is not set." };
  if (!key) return { ok: false, reason: "ERP_API_KEY is not set." };
  let u: URL;
  try {
    u = new URL(rawBase);
  } catch {
    return { ok: false, reason: "ERP_BASE_URL is not a valid URL." };
  }
  // The key travels with every call: never in clear text off this machine.
  if (u.protocol !== "https:" && !(u.protocol === "http:" && HOTES_LOCAUX.has(u.hostname))) {
    return { ok: false, reason: "ERP_BASE_URL must use https." };
  }
  const secret = (process.env.ERP_WEBHOOK_SECRET ?? "").trim() || null;
  return { ok: true, config: { base: `${u.protocol}//${u.host}`, key, secret } };
}

export function erpLinked(): boolean {
  return erpConfig().ok;
}

export function signBody(body: string, secret: string): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

export type ErpResponse = { status: number | null; text: string | null; error: string | null };

/**
 * One call to the ERP: the key in the Authorization header (never the URL),
 * the body signed with the shared secret, ten seconds at most, no redirect
 * followed (a redirected POST could carry the key to another host).
 */
export async function callErp(
  path: string,
  init: { method: "GET" | "POST"; body?: string; timeoutMs?: number } = { method: "GET" }
): Promise<ErpResponse> {
  const conf = erpConfig();
  if (!conf.ok) return { status: null, text: null, error: conf.reason };
  const { base, key, secret } = conf.config;
  const body = init.method === "POST" ? init.body ?? "" : null;
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (body !== null) headers["Content-Type"] = "application/json";
  if (secret) headers["X-Adventum-Signature"] = signBody(body ?? "", secret);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 10_000);
  try {
    const res = await fetch(`${base}${path}`, {
      method: init.method,
      headers,
      body: body ?? undefined,
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
    });
    return { status: res.status, text: await res.text().catch(() => null), error: null };
  } catch (e) {
    return {
      status: null,
      text: null,
      error: controller.signal.aborted ? "ERP timeout" : `ERP unreachable: ${e instanceof Error ? e.message : String(e)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** The ERP's own message when it refused a call (`{ "error": "…" }`). */
export function erpMessage(r: ErpResponse): string {
  if (r.status === null) return r.error ?? "ERP unreachable";
  try {
    const j = JSON.parse(r.text ?? "") as { error?: unknown };
    if (typeof j.error === "string" && j.error.trim()) return `${r.status}: ${j.error.trim().slice(0, 200)}`;
  } catch {
    /* not JSON */
  }
  return `HTTP ${r.status}`;
}
