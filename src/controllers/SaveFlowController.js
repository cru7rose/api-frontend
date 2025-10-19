/**
 * ARCHITECTURE: SaveFlowController orchestrates saving pickup/delivery/both and computing next item.
 * It follows the manifesto by isolating save intent and queue stepping away from views.
 * Responsibilities:
 * - Save via IdempotentSaveController; on success, pop next id from OrdersQueueService for Save & Next.
 */
import { Result } from "@/domain/Result";

export class SaveFlowController {
  constructor(editorFacade, queueService, idempotentSaveController) {
    this.editor = editorFacade;
    this.queue = queueService || { current: () => null, next: () => null };
    this.saveController = idempotentSaveController;
  }

  async saveThenAwait(side = "both") {
    const snap = this.editor.snapshot();
    const orderId = snap.currentOrderId || snap.editor?.detail?.orderId || null;
    if (!orderId) return Result.fail(new Error("SaveFlow: no order id."));

    const before = {
      pickup: snap.editor?.detail?.originalPickup || null,
      delivery: snap.editor?.detail?.originalDelivery || null,
    };
    const after = {
      pickup: snap.editor?.editedPickup || null,
      delivery: snap.editor?.editedDelivery || null,
    };

    const payload = { orderId, side, before, after, resolution: "MANUAL_EDIT" };
    const r = await this.saveController.save(payload);
    if (!r.ok) return r;

    const nextId = this.queue.next();
    return Result.ok({ ok: true, nextId });
  }
}
