import { NextResponse } from "next/server";
import { apiConfigured, authenticate } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Connectivity and credential check for the ERP.
 * Without a bearer token it reports whether the API is configured;
 * with a valid token it confirms the credential works.
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

  return NextResponse.json({
    status: "ok",
    service: "adventum-content-api",
    version: "1",
    configured: true,
    authenticated: true,
    capabilities: ["jobs", "posts"],
    serverTime: new Date().toISOString(),
  });
}
