/**
 * ARCHITECTURE: TelemetryService emits structured events for operational analytics without UI coupling.
 * It follows the manifesto by isolating event formatting and transport behind a simple emit() contract.
 * Responsibilities:
 * - Buffer events in-memory and flush periodically via a provided transport function.
 * - Tag events with session time, category, and correlation fields for downstream analysis.
 */
export class TelemetryService {
  constructor(transportFn = null, flushIntervalMs = 15000, maxBuffer = 200) {
    this.transportFn = typeof transportFn === "function" ? transportFn : null;
    this.flushIntervalMs = flushIntervalMs;
    this.maxBuffer = maxBuffer;
    this._buf = [];
    this._timer = null;
  }

  start() {
    if (this._timer) return false;
    this._timer = setInterval(() => this.flush().catch(() => {}), this.flushIntervalMs);
    return true;
  }

  stop() {
    if (!this._timer) return false;
    clearInterval(this._timer);
    this._timer = null;
    return true;
  }

  emit(event) {
    const e = {
      at: Date.now(),
      category: event?.category || "ux",
      name: event?.name || "unknown",
      data: event?.data || {},
      corr: event?.corr || null,
    };
    this._buf.push(e);
    if (this._buf.length >= this.maxBuffer) this.flush().catch(() => {});
    return e;
  }

  async flush() {
    if (!this.transportFn || this._buf.length === 0) return 0;
    const batch = this._buf.splice(0, this._buf.length);
    await this.transportFn(batch);
    return batch.length;
  }
}
