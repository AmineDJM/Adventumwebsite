import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { erpLinked } from "@/lib/erp";
import { getJobBySlug } from "@/lib/jobs";
import {
  CV_MAX_BYTES,
  cvKind,
  deliver,
  deliverWithoutStorage,
  newApplicationId,
  saveApplication,
  type Application,
} from "@/lib/applications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/candidatures — the careers form.
 *
 * Public by design (candidates have no account), so it is defended where it
 * stands:
 *   • a honeypot field bots fill and people never see;
 *   • a rate limit per address and a global one;
 *   • a CV checked by its CONTENT (first bytes), not by its name, 5 MB at most;
 *   • explicit consent, required — and re-checked by the ERP.
 *
 * The application goes to the ERP immediately; if the ERP cannot take it right
 * now it waits here and is retried (lib/applications.ts). The candidate is told
 * it was received either way — both are true.
 */

const WINDOW_MS = 10 * 60_000;
const PER_ADDRESS = 5;
const GLOBAL = 60;
type Holder = { __adventumRate?: { hits: Map<string, number[]>; all: number[] } };

function allowed(address: string, now = Date.now()): boolean {
  const g = globalThis as Holder;
  g.__adventumRate ??= { hits: new Map(), all: [] };
  const r = g.__adventumRate;
  r.all = r.all.filter((t) => now - t < WINDOW_MS);
  const mine = (r.hits.get(address) ?? []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= PER_ADDRESS || r.all.length >= GLOBAL) return false;
  mine.push(now);
  r.all.push(now);
  r.hits.set(address, mine);
  if (r.hits.size > 5_000) r.hits.clear();
  return true;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: FormDataEntryValue | null, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\r\n/g, "\n").trim();
  return s ? s.slice(0, max) : null;
};

function refuse(status: number, error: string, field?: string) {
  return NextResponse.json({ ok: false, error, field: field ?? null }, { status });
}

export async function POST(request: Request) {
  if (!erpLinked()) {
    return refuse(503, "applications_unavailable");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > CV_MAX_BYTES + 512 * 1024) {
    return refuse(413, "cv_too_large", "cv");
  }
  const address = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || "local";
  if (!allowed(address)) return refuse(429, "too_many_requests");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse(400, "invalid_form");
  }

  // The honeypot: a real visitor never sees this field. Answer like a success
  // so the bot learns nothing, and keep nothing.
  if (text(form.get("website"), 200)) {
    return NextResponse.json({ ok: true, reference: crypto.randomUUID().slice(0, 8).toUpperCase() }, { status: 201 });
  }

  const fullName = text(form.get("fullName"), 160);
  if (!fullName || fullName.length < 2) return refuse(422, "name_required", "fullName");
  const email = (text(form.get("email"), 254) ?? "").toLowerCase();
  if (!EMAIL.test(email)) return refuse(422, "email_invalid", "email");
  const phone = text(form.get("phone"), 40);
  if (phone && !/^[+()\d\s.-]{6,40}$/.test(phone)) return refuse(422, "phone_invalid", "phone");
  const consent = form.get("consent");
  if (consent !== "on" && consent !== "true") return refuse(422, "consent_required", "consent");

  const file = form.get("cv");
  if (!(file instanceof File) || file.size === 0) return refuse(422, "cv_required", "cv");
  if (file.size > CV_MAX_BYTES) return refuse(413, "cv_too_large", "cv");
  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = (file.name || "cv").normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").slice(-120);
  const kind = cvKind(fileName, bytes);
  if (!kind) return refuse(422, "cv_format", "cv");

  // The posting, as THIS site knows it — never taken from the form's word.
  const slug = text(form.get("jobSlug"), 120);
  const job = slug ? getJobBySlug(slug) : null;
  const application: Application = {
    id: newApplicationId(),
    submittedAt: new Date().toISOString(),
    job: job
      ? { externalId: job.externalId ?? null, slug: job.slug, title: job.title }
      : slug
      ? { externalId: null, slug, title: text(form.get("jobTitle"), 200) }
      : null,
    fullName,
    email,
    phone,
    message: text(form.get("message"), 5_000),
    consent: true,
    language: text(form.get("language"), 12),
    cv: {
      fileName,
      contentType: kind.type,
      base64: bytes.toString("base64"),
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    },
  };

  const reference = application.id.slice(0, 8).toUpperCase();
  try {
    saveApplication(application);
  } catch (e) {
    console.error("[applications] could not write the application to disk", e);
    // Nothing kept: one direct attempt. Never tell a candidate "received" when nothing is.
    if (!(await deliverWithoutStorage(application))) return refuse(503, "try_again_later");
    return NextResponse.json({ ok: true, reference, delivered: true }, { status: 201 });
  }
  const r = await deliver(application.id);
  return NextResponse.json({ ok: true, reference, delivered: r.outcome === "DELIVERED" }, { status: 201 });
}
