// ============================================================================
// Frontend: Update SaveFlowController (Final Version)
// FILE: src/controllers/SaveFlowController.js
// REASON: Correctly builds payload for /approve endpoint and calls idempotent saver.
// ============================================================================
// FILE: src/controllers/SaveFlowController.js
import { Result } from "@/domain/Result";
import { AddressEqualityService } from "@/services/AddressEqualityService"; // For diff check

/**
 * ARCHITECTURE: SaveFlowController orchestrates saving pickup/delivery/both and computing next item.
 * REFACTORED:
 * - Constructs the payload for the /api/orders/{barcode}/approve endpoint.
 * - Determines 'resolveCoordinatesIfNeeded' based on mission logic.
 * - Calls the injected 'idempotentSaveController'.
 */
export class SaveFlowController {
  constructor(editorFacade, queueService, idempotentSaveController) {
    if (!editorFacade) throw new Error("SaveFlowController requires an EditorFacade.");
    if (!queueService) throw new Error("SaveFlowController requires a QueueService.");
    if (!idempotentSaveController) throw new Error("SaveFlowController requires an IdempotentSaveController.");

    this.editor = editorFacade;
    this.queue = queueService;
    this.saveController = idempotentSaveController; // This is an IdempotentSaveController
    this.eq = new AddressEqualityService(); // For diff checking
  }

  async saveThenAwait(side = "both") {
    const snap = this.editor.snapshot();
    // Get necessary data from the editor snapshot
    const orderId = snap.currentOrderId || snap.editor?.detail?.orderId || null;
    const barcode = snap.editor?.detail?.barcode || null;
    const sourceSystem = snap.editor?.detail?.sourceSystem || null; // Get source system

    if (!orderId || !barcode) {
      log.error("[SaveFlow] Cannot save: Missing orderId or barcode in editor state.");
      return Result.fail(new Error("SaveFlow: no order id or barcode found in editor state."));
    }

    // --- Logic for resolveCoordinatesIfNeeded ---
    const allowedSources = ["DANXILS_API", "AED_SFTP", "GW_SFTP", "WMS_PINQUARK", "DANXILS_API_MULTI"]; // Added MULTI
    const originalPickup = snap.editor?.detail?.originalPickup || null;
    const originalDelivery = snap.editor?.detail?.originalDelivery || null;
    // Stored address reflects the state *before* this correction attempt (from alias check)
    const storedPickup = snap.editor?.detail?.pickupStoredAddress || null;
    const storedDelivery = snap.editor?.detail?.deliveryStoredAddress || null;
    // Edited address is the user's current input/selection
    const editedPickup = snap.editor?.editedPickup || null;
    const editedDelivery = snap.editor?.editedDelivery || null;

    let resolveCoordinatesIfNeeded = false;

    if (allowedSources.includes(sourceSystem)) {
      let pickupIsNewAndChanged = false;
      let deliveryIsNewAndChanged = false;

      // Check pickup side if it's being saved
      if ((side === "pickup" || side === "both") && editedPickup) {
        // "Brand new" means no stored address existed (it was an ALIAS_NOT_FOUND result from TES)
        // AND the user has manually edited it or accepted a suggestion (it's not the same as the original)
        const pickupChangedFromOriginal = !this.eq.equals(originalPickup, editedPickup);
        if (storedPickup === null && pickupChangedFromOriginal) {
          pickupIsNewAndChanged = true;
        }
      }

      // Check delivery side if it's being saved
      if ((side === "delivery" || side === "both") && editedDelivery) {
        const deliveryChangedFromOriginal = !this.eq.equals(originalDelivery, editedDelivery);
        if (storedDelivery === null && deliveryChangedFromOriginal) {
          deliveryIsNewAndChanged = true;
        }
      }

      // Set flag if either side represents a new, modified address from an allowed source
      if (pickupIsNewAndChanged || deliveryIsNewAndChanged) {
        resolveCoordinatesIfNeeded = true;
      }
    }

    log.info(`[SaveFlow] For Barcode: ${barcode}, Source: ${sourceSystem}, ResolveCoords: ${resolveCoordinatesIfNeeded} (Save Side: ${side})`);
    // --- End Logic for resolveCoordinatesIfNeeded ---

    // Construct the payload expected by IdempotentSaveController's save method,
    // which in turn calls AddressExceptionApi.saveCorrection (the /approve endpoint)
    const payload = {
      barcode: barcode, // Required by the /approve endpoint
      resolveCoordinatesIfNeeded: resolveCoordinatesIfNeeded, // Flag for backend
      // Include fields needed for Idempotency Token generation within IdempotentSaveController
      orderId: orderId,
      side: side,
      // 'after' represents the state being saved
      after: {
        pickup: (side === "pickup" || side === "both") ? editedPickup : null,
        delivery: (side === "delivery" || side === "both") ? editedDelivery : null
      }
    };

    // Call the IdempotentSaveController which handles the actual API call
    const saveResult = await this.saveController.save(payload);

    // Check the result format from IdempotentSaveController
    // It returns { skipped: boolean, result: Result }
    if (saveResult?.skipped) {
      log.warn(`[SaveFlow] Save skipped for Barcode ${barcode}. Reason: ${saveResult.reason}`);
      // If skipped, it's not a failure, but we don't advance the queue
      // Or do we? If it's a duplicate save, we might want to advance.
      // For now, let's treat skipped as "not saved this time"
      return Result.ok({ success: true, skipped: true, nextOrderId: null }); // Indicate skipped
    }

    if (!saveResult || !saveResult.result || !saveResult.result.ok) {
      const error = saveResult?.result?.error || new Error("Save failed or invalid response from save controller.");
      log.error(`[SaveFlow] Save failed for Barcode ${barcode}.`, error);
      return Result.fail(error); // Return failure
    }

    // Save was successful
    const currentQueueId = this.queue.current();
    if (currentQueueId === orderId) { // Double check we are removing the correct item
      this.queue.remove(currentQueueId);
      log.info(`[SaveFlow] Removed Order ID ${currentQueueId} from queue after successful save.`);
    } else {
      log.warn(`[SaveFlow] Current queue ID '${currentQueueId}' does not match saved Order ID '${orderId}'. Queue state might be inconsistent.`);
    }

    const nextId = this.queue.current() || this.queue.next(); // Get next ID
    log.info(`[SaveFlow] Save successful for Barcode ${barcode}. Next Order ID in queue: ${nextId || 'None'}`);

    return Result.ok({ success: true, skipped: false, nextOrderId: nextId }); // Indicate success and provide next ID
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};