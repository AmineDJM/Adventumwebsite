import { NextResponse } from "next/server";
import { apiConfigured, authenticate } from "@/lib/api-auth";
import { erpConfig } from "@/lib/erp";
import { processState } from "@/lib/erp-sync";
import { applicationsStatus } from "@/lib/applications";
import { dataDir } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Connectivity and credential check for the ERP.
 *
 * Without a bearer token it only says whether the API is configured. With a
 * valid token it also says what the ERP needs to show on its screen: whether
 * this site knows how to reach the ERP back (ERP_BASE_URL) and signs what it
 * sends, how many applications are waiting to be delivered, whether the data
 * directory is a fallback, and a boot id that changes on every restart (the
 * ERP resynchronises when it sees a new one). Counts and dates only — never a
 * candidate's data.
 */
export async function GET(request: Request) {
  const hasAuthHeader = Boolean(request.headers.get("authorization"));

  if (!hasAuthHeader) {
    return NextResponse.json({
      status: "ok",
      service: "adventum-content-api",
      version: "1",
      configured: apiConfigured(),
      authenticated: false,
    });
  }

  const auth = authenticate(request);
  if (!auth.ok) {
    return NextResponse.json(
      { status: "error", error: auth.error },
      { status: auth.status }
    );
  }

  const erp = erpConfig();
  const proc = processState();
  const apps = applicationsStatus();
  const storage = dataDir();
  return NextResponse.json({
    status: "ok",
    service: "adventum-content-api",
    version: "1",
    configured: true,
    authenticated: true,
    // "repository": this version lets the ERP read its committed content, take
    // it over (replacesFile / replacesJob) and ask for a reload (POST /resync).
    capabilities: ["jobs", "posts", "applications", "repository"],
    serverTime: new Date().toISOString(),
    bootId: proc.bootId,
    startedAt: proc.startedAt,
    erp: {
      linked: erp.ok,
      signing: erp.ok ? erp.config.secret !== null : Boolean((process.env.ERP_WEBHOOK_SECRET ?? "").trim()),
      reason: erp.ok ? null : erp.reason,
      lastError: apps.lastError ?? (proc.lastRestore && !proc.lastRestore.ok ? proc.lastRestore.error : null),
      lastRestore: proc.lastRestore,
    },
    applications: {
      pending: apps.pending,
      rejected: apps.rejected,
      oldestAt: apps.oldestAt,
      lastDeliveredAt: apps.lastDeliveredAt,
    },
    storage: { fallback: storage.fallback },
  });
}
