/**
 * ARCHITECTURE: OrderDetailPrefetcher warms the cache by fetching the next order detail proactively.
 * It follows the manifesto by separating performance optimizations from core controllers.
 * Responsibilities:
 * - Prefetch via AddressExceptionApi and hold a single-item cache keyed by orderId.
 * - Provide getOrFetch(id) to serve from cache or network.
 */
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class OrderDetailPrefetcher {
  constructor(api = new AddressExceptionApi()) {
    this.api = api;
    this._cachedId = null;
    this._cached = null;
  }

  async prefetch(nextOrderId) {
    if (!nextOrderId) return false;
    const r = await this.api.getOrderDetail(nextOrderId);
    if (r.ok) {
      this._cachedId = nextOrderId;
      this._cached = r.value;
      return true;
    }
    return false;
  }

  async getOrFetch(orderId) {
    if (this._cachedId === orderId && this._cached) return this._cached;
    const r = await this.api.getOrderDetail(orderId);
    if (r.ok) {
      this._cachedId = orderId;
      this._cached = r.value;
      return r.value;
    }
    throw r.error;
  }

  clear() {
    this._cachedId = null;
    this._cached = null;
    return true;
  }
}
