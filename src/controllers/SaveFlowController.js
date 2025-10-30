// ============================================================================
// Frontend: REWRITE SaveFlowController (Final Version)
// FILE: src/controllers/SaveFlowController.js
// REASON: Implement new save logic.
//         - Build corrected OrderEvent JSON from original.
//         - Build ResubmitRequestDto with 'applyToSimilar' flag.
//         - Call new api.saveResubmission endpoint.
// ============================================================================
// FILE: src/controllers/SaveFlowController.js
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { Address } from "@/domain/WorkbenchModels";

/**
 * ARCHITECTURE: SaveFlowController orchestrates saving a correction and advancing the queue.
 * REFACTORED:
 * - Constructor now takes AddressExceptionApi.
 * - `saveThenAwait` now implements the new "resubmission" flow.
 * - It patches the original OrderEvent JSON with the user's edits.
 * - It builds the ResubmitRequestDto (including correctedRawPayload and applyToSimilar).
 * - It calls api.saveResubmission() instead of the old /approve flow.
 */
export class SaveFlowController {
  constructor(editorFacade, queueService, api = new AddressExceptionApi()) {
    if (!editorFacade) throw new Error("SaveFlowController requires an EditorFacade.");
    if (!queueService) throw new Error("SaveFlowController requires a QueueService.");
    if (!api) throw new Error("SaveFlowController requires an AddressExceptionApi.");

    this.editor = editorFacade;
    this.queue = queueService;
    this.api = api;
  }

  /**
   * Saves the correction and advances to the next item in the queue.
   * @param {string} side - 'pickup', 'delivery', or 'both'. (Used to check which address was edited).
   * @param {boolean} applyToSimilar - Flag from the UI to trigger bulk reprocessing.
   */
  async saveThenAwait(side = "both", applyToSimilar = false) {
    const snap = this.editor.snapshot();
    const orderId = snap.currentOrderId || snap.editor?.detail?.orderId || null;

    // 1. Get the original error Event ID
    const errorEventId = snap.editor?.detail?.relatedError?.eventId || null;
    if (!errorEventId) {
      log.error("[SaveFlow] Cannot save: Missing relatedError.eventId in editor state.", snap.editor?.detail);
      return Result.fail(new Error("SaveFlow: Cannot save, original error event ID is missing."));
    }

    // 2. Get the original OrderEvent payload
    const originalEventJson = snap.editor?.detail?.originalOrderEventJson || null;
    if (!originalEventJson) {
      log.error("[SaveFlow] Cannot save: Missing originalOrderEventJson in editor state.", snap.editor?.detail);
      return Result.fail(new Error("SaveFlow: Cannot save, original order payload is missing."));
    }

    // 3. Reconstruct the *corrected* payload
    let correctedPayload;
    try {
      correctedPayload = this._buildCorrectedPayload(
          originalEventJson,
          snap.editor?.editedPickup,
          snap.editor?.editedDelivery
      );
    } catch (e) {
      log.error("[SaveFlow] Failed to build corrected payload:", e.message);
      return Result.fail(e);
    }

    // 4. Build the ResubmitRequestDto
    const resubmitDto = {
      errorEventId: errorEventId,
      correctedRawPayload: JSON.stringify(correctedPayload),
      applyToSimilar: !!applyToSimilar, // Pass the flag
      // 'correctedName' is not used by the new backend flow
    };

    // 5. Call the new API endpoint
    log.info(`[SaveFlow] Calling saveResubmission for EventID: ${errorEventId}, ApplySimilar: ${applyToSimilar}`);
    const saveResult = await this.api.saveResubmission(errorEventId, resubmitDto);

    if (!saveResult.ok) {
      log.error("[SaveFlow] saveResubmission failed:", saveResult.error);
      return Result.fail(saveResult.error); // Return failure
    }

    log.info(`[SaveFlow] Save successful for Order ID ${orderId}.`);

    // 6. Advance the queue
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
   * Patches the original OrderEvent JSON with fields from the edited models.
   * @param {string} originalJsonString - The raw JSON of the original OrderEvent.
   * @param {Address} editedPickup - The frontend Address model for pickup.
   * @param {Address} editedDelivery - The frontend Address model for delivery.
   * @returns {object} The patched OrderEvent object.
   */
  _buildCorrectedPayload(originalJsonString, editedPickup, editedDelivery) {
    let payload;
    try {
      payload = JSON.parse(originalJsonString);
    } catch (e) {
      throw new Error("Failed to parse originalOrderEventJson: " + e.message);
    }

    // Overwrite pickup fields if the edited model is provided
    if (editedPickup) {
      payload.pickUpAlias = editedPickup.alias;
      payload.pickUpName = editedPickup.name;
      payload.pickUpStreet = editedPickup.street;
      payload.pickUpHouseNo = editedPickup.houseNumber;
      payload.pickUpPostalCode = editedPickup.postalCode;
      payload.pickUpCity = editedPickup.city;
      payload.pickUpLatitude = editedPickup.latitude;
      payload.pickUpLongitude = editedPickup.longitude;
    }

    // Overwrite delivery fields if the edited model is provided
    if (editedDelivery) {
      payload.deliveryAlias = editedDelivery.alias;
      payload.deliveryName = editedDelivery.name;
      payload.deliveryStreet = editedDelivery.street;
      payload.deliveryHouseNo = editedDelivery.houseNumber;
      payload.deliveryPostalCode = editedDelivery.postalCode;
      payload.deliveryCity = editedDelivery.city;
      payload.deliveryLatitude = editedDelivery.latitude;
      payload.deliveryLongitude = editedDelivery.longitude;
    }

    return payload;
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};