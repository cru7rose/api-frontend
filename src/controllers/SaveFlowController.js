// ============================================================================
// Frontend: Update SaveFlowController
// FILE: src/controllers/SaveFlowController.js
// REASON: FIX: Removed dependency on the deprecated IdempotentSaveController.
//         Now uses AddressExceptionApi directly.
// ============================================================================
/**
 * ARCHITECTURE: SaveFlowController orchestrates the "Save and Next" user flow.
 * It follows the manifesto by isolating this complex UX flow from the editor.
 * REFACTORED: Now uses AddressExceptionApi for saving.
 */
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi"; // *** ADDED IMPORT ***

export class SaveFlowController {
  /**
   * @param {EditorFacade} editorFacade
   * @param {WorklistStore} worklistStore
   * @param {AddressExceptionApi} api
   */
  constructor(editorFacade, worklistStore, api = new AddressExceptionApi()) {
    this.facade = editorFacade;
    this.queue = worklistStore;
    this.api = api; // *** USE API, NOT DEPRECATED CONTROLLER ***
    // *** REMOVED: IdempotentSaveController ***
  }

  /**
   * Main entry point for the "Save and Next" flow.
   * @param {'pickup' | 'delivery' | 'both'} side
   * @param {boolean} applyToSimilar
   * @returns {Promise<Result<{nextOrderId: string | null}>>}
   */
  async saveThenAwait(side, applyToSimilar = false) {
    const { orderId, editor } = this.facade.snapshot();
    if (!orderId) {
      log.error("[SaveFlow] Cannot save: No order is loaded.");
      return Result.fail(new Error("Cannot save: No order is loaded."));
    }

    const payload = this._buildPayload(orderId, side, applyToSimilar, editor);

    try {
      // *** USE API DIRECTLY ***
      const saveResult = await this.api.saveCorrection(payload);
      if (!saveResult.ok) {
        log.error("[SaveFlow] API save failed:", saveResult.error);
        return Result.fail(saveResult.error); // Propagate API error
      }

      log.info(`[SaveFlow] Order ${orderId} saved successfully (Side: ${side}).`);

      // We no longer wait for polling, we trust the save.
      // 2. Remove saved item from worklist
      this.queue.removeItem(orderId);

      // 3. Get next item
      const nextId = this.queue.getNextItem(orderId);
      log.info(`[SaveFlow] Next order ID: ${nextId}`);

      return Result.ok({ nextOrderId: nextId });

    } catch (e) {
      log.error(`[SaveFlow] Unhandled exception during saveThenAwait for order ${orderId}:`, e);
      return Result.fail(new Error(`Save failed: ${e.message}`));
    }
  }

  _buildPayload(orderId, side, applyToSimilar, editorState) {
    const pickupPayload = (side === 'pickup' || side === 'both') ? editorState.editedPickup.toPlain() : null;
    const deliveryPayload = (side === 'delivery' || side === 'both') ? editorState.editedDelivery.toPlain() : null;

    // The API DTO expects the full corrected address object (including alias/name)
    // The `toPlain()` method on Address model now includes alias and name.

    return {
      orderId: orderId,
      side: side,
      resolution: "MANUAL_EDIT", // This flow is always a manual edit
      applyToSimilar: applyToSimilar,
      correctedPickup: pickupPayload ? {
        alias: pickupPayload.alias,
        name: pickupPayload.name,
        address: pickupPayload // The AddressDto is the plain Address object
      } : null,
      correctedDelivery: deliveryPayload ? {
        alias: deliveryPayload.alias,
        name: deliveryPayload.name,
        address: deliveryPayload // The AddressDto is the plain Address object
      } : null,
      resolveCoordinatesIfNeeded: true // Always resolve on manual save
    };
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};