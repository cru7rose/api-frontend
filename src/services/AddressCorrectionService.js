/**
 * ARCHITECTURE: AddressCorrectionService persists address fixes to the backend and records an audit entry.
 * It follows the manifesto by isolating persistence and audit concerns behind one explicit contract.
 * Responsibilities:
 * - Save corrections via AddressExceptionApi with explicit resolution mode.
 * - Append audit entries using AddressAuditTrailService and provide a deterministic Result object.
 */
import { Result } from "@/domain/Result";
import { AddressAuditTrailService } from "@/services/AddressAuditTrailService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class AddressCorrectionService {
  constructor(api = new AddressExceptionApi(), audit = new AddressAuditTrailService()) {
    this.api = api;
    this.audit = audit;
  }

  async save({ orderId, side, before, after, resolution }) {
    const res = await this.api.saveCorrection({
      orderId,
      side,
      correctedPickup: side === "pickup" || side === "both" ? after?.pickup || null : null,
      correctedDelivery: side === "delivery" || side === "both" ? after?.delivery || null : null,
      resolution: resolution || "MANUAL_EDIT",
    });
    if (!res.ok) return Result.fail(res.error);
    this.audit.append({
      orderId,
      side,
      action: resolution || "MANUAL_EDIT",
      before,
      after,
      diff: null,
    });
    return Result.ok(res.value);
  }
}
