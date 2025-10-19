/**
 * ARCHITECTURE: PollingService centralizes controlled, single-instance polling loops per key.
 * It follows the manifesto by isolating timing concerns and exposing explicit start/stop contracts.
 * Responsibilities:
 * - Start a debounced timer for an async function and prevent duplicate loops for the same key.
 * - Provide deterministic cancellation via handles and bulk stop-All capability.
 */
export class PollingService {
  constructor() {
    this._timers = new Map();
  }

  start(key, intervalMs, asyncFn) {
    if (!key || typeof asyncFn !== "function" || typeof intervalMs !== "number" || intervalMs <= 0) {
      throw new Error("PollingService.start: invalid arguments.");
    }
    this.stop(key);
    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        await asyncFn();
      } catch (_) {
        // Errors are handled upstream; polling continues unless explicitly stopped.
      }
      if (active) {
        this._timers.set(key, setTimeout(tick, intervalMs));
      }
    };
    this._timers.set(key, setTimeout(tick, intervalMs));
    return { key, stop: () => this.stop(key) };
  }

  stop(key) {
    const t = this._timers.get(key);
    if (t) {
      clearTimeout(t);
      this._timers.delete(key);
    }
  }

  stopAll() {
    for (const key of this._timers.keys()) {
      this.stop(key);
    }
  }
}
