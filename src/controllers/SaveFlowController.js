// ============================================================================
// Frontend: REWRITE SaveFlowController (Final Version)
// FILE: src/controllers/SaveFlowController.js
// REASON: Implement new save logic.
//         - Build OrderCorrectionRequestDTO from editor state.
//         - Build ResubmitRequestDto with 'applyToSimilar' flag.
//         - Call new api.saveApproval endpoint.
//
// **BUGFIX**: Correctly access `snap.orderId` and `snap.detail.barcode`
//             instead of the incorrect `snap.editor.detail.barcode`.
// ============================================================================
// FILE: src/controllers/SaveFlowController.js
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { Address } from "@/domain/WorkbenchModels";

/**
 * ARCHITECTURE: SaveFlowController orchestrates saving a correction and advancing the queue.
 * REFACTORED:
 * - Constructor now takes AddressExceptionApi.
 * - `saveThenAwait` now implements the new "approval" flow.
 * - It builds the OrderCorrectionRequestDTO (including corrected addresses and applyToSimilar).
 * - It calls api.saveApproval() instead of the old /resubmit flow.
 */
export class SaveFlowController {
  constructor(editorFacade, api = new AddressExceptionApi()) { // queueService removed
    if (!editorFacade) throw new Error("SaveFlowController requires an EditorFacade.");
    if (!editorFacade.queue) throw new Error("SaveFlowController requires the EditorFacade to have a 'queue' (OrdersQueueService) property."); // Validate it's on the facade
    if (!api) throw new Error("SaveFlowController requires an AddressExceptionApi.");

    this.editor = editorFacade;
    this.queue = editorFacade.queue; // Get the correct queue from the facade
    this.api = api;
  }

  /**
   * Saves the correction and advances to the next item in the queue.
   * @param {string} side - 'pickup', 'delivery', or 'both'.
   * @param {boolean} applyToSimilar - Flag from the UI to trigger bulk reprocessing.
   */
  async saveThenAwait(side = "both", applyToSimilar = false) {
    const snap = this.editor.snapshot();

    // *** CORRECTION: Access snapshot properties directly ***
    const orderId = snap.orderId || null;
    const barcode = snap.detail?.barcode || null;
    // *** END CORRECTION ***

    if (!orderId || !barcode) {
      log.error("[SaveFlow] Cannot save: Missing orderId or barcode in editor state.", snap.detail); // Log snap.detail
      return Result.fail(new Error("SaveFlow: Cannot save, order data is missing."));
    }

    // 1. Build the OrderCorrectionRequestDTO
    const correctionDto = this._buildCorrectionPayload(
        snap.editedPickup, // Access corrected state from root of snap
        snap.editedDelivery, // Access corrected state from root of snap
        applyToSimilar
    );
// 2. Call the new API endpoint
    log.info(`[SaveFlow] Calling saveApproval for Barcode: ${barcode}, ApplySimilar: ${applyToSimilar}`);
    const saveResult = await this.api.saveApproval(barcode, correctionDto);

    if (!saveResult.ok) {
      log.error("[SaveFlow] saveApproval failed:", saveResult.error);
      return Result.fail(saveResult.error);
// Return failure
    }

    log.info(`[SaveFlow] Save successful for Order ID ${orderId}.`);
// 3. Advance the queue
    const currentQueueId = this.queue.current();
    if (currentQueueId === orderId) {
      this.queue.remove(currentQueueId);
      log.info(`[SaveFlow] Removed Order ID ${currentQueueId} from queue.`);
    } else {
      log.warn(`[SaveFlow] Queue ID ('${currentQueueId}') mismatch saved ID ('${orderId}').`);
    }

    const nextId = this.queue.current() || this.queue.next();
    log.info(`[SaveFlow] Next Order ID in queue: ${nextId || 'None'}`);
    return Result.ok({ success: true, skipped: false, nextOrderId: nextId });
  }

  /**
   * Builds the OrderCorrectionRequestDTO from the editor's state.
   * @param {Address} editedPickup - The frontend Address model for pickup.
   * @param {Address} editedDelivery - The frontend Address model for delivery.
   * @param {boolean} applyToSimilar - Flag from the UI.
   * @returns {object} The OrderCorrectionRequestDTO.
   */
  _buildCorrectionPayload(editedPickup, editedDelivery, applyToSimilar) {

    // Helper to convert frontend Address model to the required backend DTO format
    const mapToCorrectedAddress = (addrModel) => {
      if (!addrModel) return null;
      return {
        alias: addrModel.alias,
        name: addrModel.name,
        address: {
          street: addrModel.street,
          houseNumber: addrModel.houseNumber,
          postalCode: addrModel.postalCode,
          city: addrModel.city,
          // Country is removed
          latitude: addrModel.latitude,

          longitude: addrModel.longitude,
        }
      };
    };

    return {
      pickup: mapToCorrectedAddress(editedPickup),
      delivery: mapToCorrectedAddress(editedDelivery),
      resolveCoordinatesIfNeeded: true, // Always resolve coords on manual approval
      applyToSimilar: !!applyToSimilar
    };
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};