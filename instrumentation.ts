/**
 * Runs once when the server process starts (Next.js instrumentation hook).
 *
 * Two background duties, both only when the site is linked to the ERP:
 *   1. reload jobs and articles from the ERP (the free plan has no disk —
 *      whatever the ERP pushed before a restart is gone);
 *   2. every minute, deliver the applications still waiting (the ERP was
 *      asleep or redeploying when the candidate clicked "Send"), and retry a
 *      failed reload.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startRestore, processState } = await import("./lib/erp-sync");
  const { deliverDue } = await import("./lib/applications");
  const { erpLinked } = await import("./lib/erp");

  const holder = globalThis as { __adventumTimer?: ReturnType<typeof setInterval> };
  if (holder.__adventumTimer) return;

  processState();
  if (erpLinked()) void startRestore();

  const tick = async () => {
    if (!erpLinked()) return;
    try {
      await startRestore();
      await deliverDue();
    } catch (e) {
      console.error("[background] tick failed", e);
    }
  };
  holder.__adventumTimer = setInterval(() => void tick(), 60_000);
  holder.__adventumTimer.unref?.();
}
