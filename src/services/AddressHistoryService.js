/**
 * ARCHITECTURE: AddressHistoryService records a per-order timeline of edits and applied suggestions.
 * It follows the manifesto by providing an append-only log consumable by the audit or session history.
 * Responsibilities:
 * - Append events with before/after snapshots and provider info; read back per orderId.
 */
export class AddressHistoryService {
  constructor() {
    this._byOrder = new Map();
  }

  append(orderId, payload) {
    if (!orderId) return false;
    const list = this._byOrder.get(orderId) || [];
    list.push({
      at: new Date().toISOString(),
      type: payload?.type || "EDIT",
      side: payload?.side || "both",
      provider: payload?.provider || null,
      before: payload?.before || null,
      after: payload?.after || null,
    });
    this._byOrder.set(orderId, list);
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
