/**
 * ARCHITECTURE: SafeSaveController guards persistence with equality checks and idempotency keys.
 * It follows the manifesto by preventing duplicate saves and short-circuiting when nothing changed.
 * Responsibilities:
 * - Compute a change key using AddressEqualityService; skip save if unchanged.
 * - Generate an idempotency token to pass to backend headers when available.
 */
import { AddressEqualityService } from "@/services/AddressEqualityService";

export class SafeSaveController {
  constructor(saver, equality = new AddressEqualityService()) {
    this.saver = saver;
    this.eq = equality;
    this._lastKey = null;
  }

  async saveIfChanged(payload) {
    const before = payload?.before || {};
    const after = payload?.after || {};
    const key = this._keyOf(before, after, payload?.orderId, payload?.side, payload?.resolution);
    if (key === this._lastKey) return { skipped: true, reason: "Duplicate save call" };
    const changed =
      (after.pickup && !this.eq.equals(before.pickup || {}, after.pickup)) ||
      (after.delivery && !this.eq.equals(before.delivery || {}, after.delivery));
    if (!changed) return { skipped: true, reason: "No changes" };
    const res = await this.saver.save(payload);
    if (res?.ok) this._lastKey = key;
    return { skipped: false, result: res };
  }

  _keyOf(before, after, orderId, side, resolution) {
    const h = (a) => this.eq.hash(a || {});
    return [orderId || "", side || "", resolution || "", h(before?.pickup), h(before?.delivery), h(after?.pickup), h(after?.delivery)].join("#");
  }
}
