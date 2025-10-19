/**
 * ARCHITECTURE: AddressPersistenceMapper shapes editor state into backend save payloads.
 * It follows the manifesto by isolating transport DTO mapping away from controllers and views.
 * Responsibilities:
 * - Map orderId, side, before/after models and resolution into /corrections payload.
 */
export class AddressPersistenceMapper {
  toSavePayload(orderId, side, before, after, resolution) {
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
