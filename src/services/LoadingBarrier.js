/**
 * ARCHITECTURE: LoadingBarrier serializes concurrent loads by key and ensures latest-wins semantics.
 * It follows the manifesto by centralizing anti-race logic for order detail fetches and suggestion refreshes.
 * Responsibilities:
 * - Track an incrementing ticket per key; resolve only if the ticket is still current when the promise returns.
 * - Provide a simple run(key, fn) API that callers wrap around their async loads.
 */
export class LoadingBarrier {
  constructor() {
    this._tickets = new Map();
  }

  async run(key, fn) {
    if (!key || typeof fn !== "function") throw new Error("LoadingBarrier: invalid arguments.");
    const next = (this._tickets.get(key) || 0) + 1;
    this._tickets.set(key, next);
    const myTicket = next;
    const result = await fn();
    if (this._tickets.get(key) !== myTicket) return null;
    return result;
  }

  invalidate(key) {
    const next = (this._tickets.get(key) || 0) + 1;
    this._tickets.set(key, next);
    return next;
  }
}
