// ============================================================================
// Frontend: Mark AddressPersistenceMapper as Deprecated
// FILE: src/services/AddressPersistenceMapper.js
// REASON: This mapper is bypassed by the new save flow.
// ============================================================================
// FILE: src/services/AddressPersistenceMapper.js (Supersedes previous version)

/**
 * ARCHITECTURE: AddressPersistenceMapper shapes editor state into backend save payloads.
 * DEPRECATED: This mapper creates a payload for the old /corrections endpoint.
 * The flow is now handled by SaveFlowController -> IdempotentSaveController
 * which build a payload for the /api/orders/{barcode}/approve endpoint.
 * @deprecated
 */
export class AddressPersistenceMapper {
  toSavePayload(orderId, side, before, after, resolution) {
    console.warn("DEPRECATED: AddressPersistenceMapper.toSavePayload called. This logic is obsolete.");
    const s = (side || "both").toLowerCase();
    const body = {
      orderId: orderId,
      side: s === "pickup" || s === "delivery" ? s : "both",
      resolution: resolution || "MANUAL_EDIT",
      correctedPickup: s === "delivery" ? null : (after?.pickup || after?.correctedPickup || after?.editedPickup || after || null),
      correctedDelivery: s === "pickup" ? null : (after?.delivery || after?.correctedDelivery || after?.editedDelivery || after || null),
      beforePickup: s === "delivery" ? null : (before?.pickup || before?.originalPickup || before || null),
      beforeDelivery: s === "pickup" ? null : (before?.delivery || before?.originalDelivery || before || null),
    };
    return body;
  }
}