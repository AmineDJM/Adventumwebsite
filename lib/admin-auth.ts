import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal session auth for the admin area — no dependency, no user store.
 *
 * A successful login sets an httpOnly cookie holding "<expiry>.<hmac>".
 * The HMAC is computed server-side with ADMIN_SESSION_SECRET, so the cookie
 * cannot be forged by a client. ADMIN_PASSWORD must be set in the
 * environment: when it is absent the admin area refuses every login rather
 * than falling back to a guessable default.
 */

export const SESSION_COOKIE = "adventum_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    ""
  );
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Constant-time password comparison. */
export function verifyPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(String(candidate));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac) return false;
  if (Number(expires) < Date.now()) return false;

  const expected = sign(expires);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Server-side guard for API routes. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
