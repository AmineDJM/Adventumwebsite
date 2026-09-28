import crypto from "node:crypto";

/**
 * Machine-to-machine authentication for the content API (/api/v1/*).
 *
 * The ERP authenticates with a bearer key held in ERP_API_KEY. This is a
 * separate credential from the human admin password (ADMIN_PASSWORD): the
 * two surfaces can be revoked independently, and a leaked ERP key never
 * grants access to the browser admin.
 *
 * Optionally, requests can also carry an HMAC signature of the raw body in
 * X-Adventum-Signature. When ERP_WEBHOOK_SECRET is set the signature is
 * required and verified, which protects against a replayed or tampered
 * payload even if the bearer key leaks from a proxy log.
 */

const MIN_KEY_LENGTH = 24;

export type AuthFailure = { ok: false; status: number; error: string };
export type AuthSuccess = { ok: true };
export type AuthResult = AuthSuccess | AuthFailure;

export function apiConfigured(): boolean {
  const key = process.env.ERP_API_KEY;
  return Boolean(key && key.length >= MIN_KEY_LENGTH);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Verify bearer key and, when configured, the body signature. */
export function authenticate(request: Request, rawBody = ""): AuthResult {
  const key = process.env.ERP_API_KEY;

  if (!key) {
    return {
      ok: false,
      status: 503,
      error:
        "Content API disabled: ERP_API_KEY is not set on the website environment.",
    };
  }
  if (key.length < MIN_KEY_LENGTH) {
    return {
      ok: false,
      status: 503,
      error: `Content API disabled: ERP_API_KEY must be at least ${MIN_KEY_LENGTH} characters.`,
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!presented || !safeEqual(presented, key)) {
    return { ok: false, status: 401, error: "Invalid or missing bearer token." };
  }

  const secret = process.env.ERP_WEBHOOK_SECRET;
  if (secret) {
    const provided = request.headers.get("x-adventum-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (!provided || !safeEqual(provided.replace(/^sha256=/, ""), expected)) {
      return { ok: false, status: 401, error: "Invalid body signature." };
    }
  }

  return { ok: true };
}
