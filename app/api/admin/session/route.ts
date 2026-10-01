import { NextResponse } from "next/server";
import { erpLinked } from "@/lib/erp";
import {
  SESSION_COOKIE,
  adminConfigured,
  createSessionToken,
  isAuthenticated,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Session probe — lets the admin UI restore a signed-in state on reload.
 * `managedByErp`: the site is linked to the ERP, which owns the postings — the
 * admin then only shows them (a posting typed here would compete with the
 * ERP's and, without a disk, vanish at the next restart).
 */
export async function GET() {
  return NextResponse.json({
    authenticated: await isAuthenticated(),
    configured: adminConfigured(),
    managedByErp: erpLinked(),
  });
}

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin access is not configured. Set the ADMIN_PASSWORD environment variable.",
      },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    // Blunt the edge off brute-force attempts without blocking a real user.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
