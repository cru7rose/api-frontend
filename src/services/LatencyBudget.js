/**
 * ARCHITECTURE: LatencyBudget enforces per-step execution budgets for snappy UX under load.
 * It follows the manifesto by isolating timing limits and providing a race-with-timeout helper.
 * Responsibilities:
 * - Wrap a promise with a timeout; resolve fallback when exceeded; report elapsed for telemetry.
 */
export class LatencyBudget {
  constructor(defaultMs = 1200) {
    this.defaultMs = Math.max(100, defaultMs);
  }

  async runWithTimeout(promiseFactory, timeoutMs = this.defaultMs, fallback = null) {
    const start = Date.now();
    const to = new Promise(resolve => setTimeout(() => resolve({ timeout: true, value: fallback }), Math.max(50, timeoutMs)));
    const op = Promise.resolve().then(() => promiseFactory()).then(v => ({ timeout: false, value: v }));
    const res = await Promise.race([to, op]);
    const elapsedMs = Date.now() - start;
    return { ...res, elapsedMs };
  }
}
