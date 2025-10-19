/**
 * ARCHITECTURE: AddressAuditTrailService maintains an in-memory audit stream for user actions.
 * It follows the manifesto by isolating audit appends and allowing later persistence without UI impact.
 * Responsibilities:
 * - Append entries and read them by orderId; provide a clear method for testability.
 */
export class AddressAuditTrailService {
  constructor() {
    this._byOrder = new Map();
  }

  append(entry) {
    const id = entry?.orderId || "unknown";
    const list = this._byOrder.get(id) || [];
    list.push({ ...entry, at: new Date().toISOString() });
    this._byOrder.set(id, list);
    return true;
  }

  list(orderId) {
    return (this._byOrder.get(orderId) || []).slice();
  }

  clear(orderId) {
    if (!orderId) return false;
    this._byOrder.delete(orderId);
    return true;
  }
}
