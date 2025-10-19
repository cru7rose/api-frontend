/**
 * ARCHITECTURE: OrderStatusWatcher polls backend for a single order until a target status is reached.
 * It follows the manifesto by isolating polling semantics from views and controllers with a clear contract.
 * Responsibilities:
 * - Poll /orders/{id} at a fixed interval and resolve when status ∈ target set or when max time elapses.
 * - Expose start(), cancel(), and onTick hooks for progress indicators without leaking transport details.
 */
import apiClient from "@/services/api";

export class OrderStatusWatcher {
  constructor(intervalMs = 2000, timeoutMs = 60000) {
    this.intervalMs = Math.max(250, intervalMs);
    this.timeoutMs = Math.max(this.intervalMs, timeoutMs);
    this._timer = null;
    this._startedAt = 0;
    this._active = false;
    this._onTick = null;
  }

  onTick(fn) {
    this._onTick = typeof fn === "function" ? fn : null;
    return this;
  }

  start(orderId, targetStatuses = ["ADDRESS_VALIDATED", "MANUALLY_CORRECTED"]) {
    if (!orderId) throw new Error("OrderStatusWatcher: orderId required.");
    this.cancel();
    this._active = true;
    this._startedAt = Date.now();
    return new Promise((resolve, reject) => {
      const tick = async () => {
        if (!this._active) return;
        try {
          const r = await apiClient.get(`/orders/${encodeURIComponent(orderId)}`);
          const status = r?.data?.processingStatus || null;
          if (this._onTick) this._onTick({ status, elapsedMs: Date.now() - this._startedAt });
          if (status && targetStatuses.includes(status)) {
            this.cancel();
            return resolve({ status, elapsedMs: Date.now() - this._startedAt });
          }
        } catch (e) {
          this.cancel();
          return reject(e);
        }
        if (Date.now() - this._startedAt > this.timeoutMs) {
          this.cancel();
          return resolve({ status: null, elapsedMs: this.timeoutMs, timeout: true });
        }
        this._timer = setTimeout(tick, this.intervalMs);
      };
      this._timer = setTimeout(tick, this.intervalMs);
    });
  }

  cancel() {
    this._active = false;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    return true;
  }
}
