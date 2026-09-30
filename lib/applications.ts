import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, writeJsonAtomic } from "@/lib/storage";
import { callErp, erpLinked, erpMessage } from "@/lib/erp";

/**
 * Applications submitted on the careers pages — delivered to the ERP.
 *
 * The site does not keep candidates' data: an application is written to disk
 * only as long as it has not reached the ERP, and deleted the moment the ERP
 * confirms it (201, or 200 for a copy it already had). Delivery is attempted
 * right away, while the candidate waits; if the ERP is asleep or redeploying,
 * it is retried in the background with a growing delay (1, 2, 4… minutes, up
 * to an hour).
 *
 * THE ONE HONEST LIMIT: on a host without a persistent disk, an application
 * still waiting when the site restarts is lost. That is why delivery is tried
 * immediately, and why /api/v1/health reports how many are waiting — the ERP
 * shows that number, so a stuck queue is never invisible.
 */

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export type Application = {
  id: string;
  submittedAt: string;
  job: { externalId: string | null; slug: string | null; title: string | null } | null;
  fullName: string;
  email: string;
  phone: string | null;
  message: string | null;
  consent: true;
  language: string | null;
  cv: { fileName: string; contentType: string; base64: string; sha256: string } | null;
};

type Stored = Application & {
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  /** The ERP refused it for good (4xx other than 401/429): kept a week for inspection, then dropped. */
  rejectedAt?: string | null;
};

const dir = () => path.join(dataDir().dir, "applications");
const fileOf = (id: string) => path.join(dir(), `${id}.json`);

export function newApplicationId(): string {
  return crypto.randomUUID();
}

/** What the file's first bytes say it is — an extension alone is only a claim. */
export function cvKind(fileName: string, bytes: Buffer): { ext: string; type: string } | null {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text",
  };
  const type = types[ext];
  if (!type || bytes.length < 8) return null;
  const pdf = bytes.subarray(0, 5).toString("latin1") === "%PDF-";
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  const ole = bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const ok = (ext === "pdf" && pdf) || ((ext === "docx" || ext === "odt") && zip) || (ext === "doc" && ole);
  return ok ? { ext, type } : null;
}

export function saveApplication(app: Application): void {
  const stored: Stored = { ...app, attempts: 0, nextAttemptAt: new Date().toISOString(), lastError: null, rejectedAt: null };
  writeJsonAtomic(fileOf(app.id), stored);
}

function readStored(file: string): Stored | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Stored;
  } catch {
    return null;
  }
}

function listStored(): { file: string; app: Stored }[] {
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir()).filter((n) => n.endsWith(".json"));
  } catch {
    return [];
  }
  return names
    .map((n) => ({ file: path.join(dir(), n), app: readStored(path.join(dir(), n)) }))
    .filter((x): x is { file: string; app: Stored } => x.app !== null);
}

function wire(app: Application): string {
  // The ERP's contract (docs/ERP-INTEGRATION.md §11). Serialized ONCE: the
  // signature covers these exact bytes.
  return JSON.stringify({
    id: app.id,
    submittedAt: app.submittedAt,
    job: app.job,
    fullName: app.fullName,
    email: app.email,
    phone: app.phone,
    message: app.message,
    consent: app.consent,
    language: app.language,
    cv: app.cv,
  });
}

type DeliveryState = { lastError: string | null; lastErrorAt: string | null; lastDeliveredAt: string | null };
type Holder = { __adventumDelivery?: DeliveryState; __adventumDeliveryRunning?: Set<string> };

function deliveryState(): DeliveryState {
  const g = globalThis as Holder;
  g.__adventumDelivery ??= { lastError: null, lastErrorAt: null, lastDeliveredAt: null };
  return g.__adventumDelivery;
}

function running(): Set<string> {
  const g = globalThis as Holder;
  g.__adventumDeliveryRunning ??= new Set();
  return g.__adventumDeliveryRunning;
}

export type DeliveryOutcome = "DELIVERED" | "RETRY" | "REJECTED" | "BUSY";

/**
 * Send one application to the ERP. Never throws. The same application is
 * never sent twice at the same time (the background loop and the form's
 * immediate attempt could otherwise race); a copy the ERP already has comes
 * back as 200, which is success too.
 */
export async function deliver(id: string): Promise<{ outcome: DeliveryOutcome; message: string | null }> {
  if (running().has(id)) return { outcome: "BUSY", message: null };
  running().add(id);
  try {
    const file = fileOf(id);
    const app = readStored(file);
    if (!app) return { outcome: "DELIVERED", message: null };
    const r = await callErp("/api/site-web/v1/candidatures", { method: "POST", body: wire(app), timeoutMs: 8_000 });
    const st = deliveryState();
    if (r.status === 200 || r.status === 201) {
      fs.rmSync(file, { force: true });
      st.lastDeliveredAt = new Date().toISOString();
      return { outcome: "DELIVERED", message: null };
    }
    const message = erpMessage(r);
    st.lastError = message;
    st.lastErrorAt = new Date().toISOString();
    // 401 (the key is being changed) and 429 (slow down) are worth retrying; any other 4xx
    // is the ERP saying this application will never be accepted as it is.
    const permanent = r.status !== null && r.status >= 400 && r.status < 500 && r.status !== 401 && r.status !== 429;
    const attempts = app.attempts + 1;
    const delay = Math.min(60, 2 ** Math.min(attempts - 1, 6)) * 60_000;
    writeJsonAtomic(file, {
      ...app,
      attempts,
      lastError: message,
      nextAttemptAt: new Date(Date.now() + (permanent ? 24 * 3_600_000 : delay)).toISOString(),
      rejectedAt: permanent ? new Date().toISOString() : null,
    } satisfies Stored);
    console.warn(`[applications] ${id} not delivered (${message})${permanent ? " — refused by the ERP" : ""}`);
    return { outcome: permanent ? "REJECTED" : "RETRY", message };
  } catch (e) {
    return { outcome: "RETRY", message: e instanceof Error ? e.message : String(e) };
  } finally {
    running().delete(id);
  }
}

/**
 * When the disk cannot be written at all: one direct attempt, nothing kept.
 * The caller tells the candidate the truth either way.
 */
export async function deliverWithoutStorage(app: Application): Promise<boolean> {
  const r = await callErp("/api/site-web/v1/candidatures", { method: "POST", body: wire(app), timeoutMs: 8_000 });
  if (r.status === 200 || r.status === 201) {
    deliveryState().lastDeliveredAt = new Date().toISOString();
    return true;
  }
  const st = deliveryState();
  st.lastError = erpMessage(r);
  st.lastErrorAt = new Date().toISOString();
  return false;
}

/** The background pass: every application whose next attempt is due. */
export async function deliverDue(now = Date.now()): Promise<{ delivered: number; pending: number }> {
  if (!erpLinked()) return { delivered: 0, pending: listStored().length };
  let delivered = 0;
  for (const { file, app } of listStored()) {
    // A refusal is kept a week so it can be looked at, then the personal data goes.
    if (app.rejectedAt && now - Date.parse(app.rejectedAt) > 7 * 24 * 3_600_000) {
      fs.rmSync(file, { force: true });
      continue;
    }
    if (app.rejectedAt || Date.parse(app.nextAttemptAt) > now) continue;
    const r = await deliver(app.id);
    if (r.outcome === "DELIVERED") delivered += 1;
  }
  return { delivered, pending: listStored().filter((x) => !x.app.rejectedAt).length };
}

/** What /api/v1/health reports — counts and dates, never a candidate's data. */
export function applicationsStatus(): {
  pending: number;
  rejected: number;
  oldestAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  lastDeliveredAt: string | null;
} {
  const all = listStored();
  const waiting = all.filter((x) => !x.app.rejectedAt);
  const oldest = waiting.map((x) => x.app.submittedAt).sort()[0] ?? null;
  const st = deliveryState();
  return {
    pending: waiting.length,
    rejected: all.length - waiting.length,
    oldestAt: oldest,
    lastError: st.lastError,
    lastErrorAt: st.lastErrorAt,
    lastDeliveredAt: st.lastDeliveredAt,
  };
}
