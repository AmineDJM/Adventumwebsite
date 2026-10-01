import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authenticate } from "@/lib/api-auth";
import { erpLinked } from "@/lib/erp";
import { startRestore } from "@/lib/erp-sync";

export const dynamic = "force-dynamic";

/**
 * The ERP asks the site to RELOAD its content now — the same reload the site
 * performs when it starts (GET /api/site-web/v1/contenus): jobs, articles, and
 * the repository articles the ERP has taken over.
 *
 * It exists for the rare case where a restart would otherwise be the only
 * repair: a record lost while the site was asleep, a takeover the site missed.
 * Reloads are spaced (30 s) whoever asks, so the key cannot turn this into a
 * way to hammer the ERP. Authenticated like the rest of the content API; the
 * body is empty and signed as such.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const auth = authenticate(request, raw);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!erpLinked()) {
    return NextResponse.json({ error: "This site does not know the ERP's address (ERP_BASE_URL)." }, { status: 503 });
  }
  const asked = new Date().toISOString();
  const running = startRestore({ force: true });
  if (!running) {
    return NextResponse.json({ error: "Reload unavailable." }, { status: 503 });
  }
  const result = await Promise.race([
    running,
    new Promise<null>((r) => setTimeout(() => r(null), 20_000).unref?.()),
  ]);
  if (!result) return NextResponse.json({ reloading: true }, { status: 202 });
  // A reload that STARTED before this request (spaced, or already running) does not answer it: the
  // change the ERP is asking about may postdate it. Said as such — never reported as "reloaded".
  if (result.at < asked) {
    return NextResponse.json(
      { error: "A reload has just run: ask again in 30 seconds.", lastReload: result },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }
  if (result.ok) {
    revalidatePath("/blog");
    revalidatePath("/carrieres");
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
  }
  return NextResponse.json({ reloaded: result.ok, result }, { status: result.ok ? 200 : 502 });
}
