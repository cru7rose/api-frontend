// ============================================================================
// Frontend: Update EditorFacade.js
// FILE: src/controllers/EditorFacade.js
// REASON: Draw markers and route on load.
//         Pass 'side' to preview controller.
// REASON (NEW): Add geocode-on-load logic if coordinates are missing.
// ============================================================================
/**
 * ARCHITECTURE: EditorFacade wraps CorrectionEditorController and adds map preview conveniences.
 * It follows the manifesto by exposing intent methods used by the Editor view without leaking internals.
 * REFACTORED:
 * - 'load' now draws both markers and the OSRM route on success.
 * - 'load' now automatically geocodes pickup/delivery if coordinates are missing.
 * - 'accept...Suggestion' methods now pass the correct 'side' to the previewer.
 */
import { Result } from "@/domain/Result";
import { SuggestionPreviewController } from "@/controllers/SuggestionPreviewController";

export class EditorFacade {
  constructor(editorController, mapController = null, _placesAdapter = null, queue = null) {
    this.ctrl = editorController;
    this.queue = queue || null;
    this.preview = mapController ? new SuggestionPreviewController(mapController) : null;
  }

  async load(orderId) {
    const loadResult = await this.ctrl.loadOrder(orderId);
    if (!loadResult.ok) {
      return loadResult;
    }

    // --- NEW: Geocode on load if coordinates are missing ---
    let snap = this.ctrl.snapshot();
    let geocodeNeeded = false;

    const p = snap.editor?.editedPickup;
    if (p && (p.latitude == null || p.longitude == null)) {
      log.info(`[EditorFacade] Pickup (Barcode: ${snap.editor?.detail?.barcode}) missing coordinates. Geocoding on load.`);
      await this.ctrl.geocodeEdited("pickup");
      geocodeNeeded = true;
    }

    const d = snap.editor?.editedDelivery;
    if (d && (d.latitude == null || d.longitude == null)) {
      log.info(`[EditorFacade] Delivery (Barcode: ${snap.editor?.detail?.barcode}) missing coordinates. Geocoding on load.`);
      await this.ctrl.geocodeEdited("delivery");
      geocodeNeeded = true;
    }

    if (geocodeNeeded) {
      snap = this.ctrl.snapshot(); // Refresh snapshot after geocoding
    }
    // --- END NEW ---


    // --- NEW: Draw markers and route on load ---
    if (this.preview) {
      try {
        // Use editedPickup/Delivery which are initialized from the originals (and now geocoded)
        if (snap.editor.editedPickup && snap.editor.editedDelivery) {
          log.info("[EditorFacade] Loading complete. Drawing initial markers and route.");
          await this.preview.policy.showAndFitRoute(
              snap.editor.editedPickup,
              snap.editor.editedDelivery
          );
        }
      } catch (e) {
        log.error("[EditorFacade] Failed to draw map route on load:", e);
      }
    }
    // --- END NEW ---

    return loadResult;
  }

  snapshot() {
    return { editor: this.ctrl.snapshot(), currentOrderId: this.ctrl?.detail?.orderId || null };
  }

  setManualPickup(addr) {
    return this.ctrl.setManualAddress("pickup", addr);
  }

  setManualDelivery(addr) {
    return this.ctrl.setManualAddress("delivery", addr);
  }

  setPickupSuggestions(list) {
    // This method (setSuggestions) doesn't exist on CorrectionEditorController
    // but I am leaving the facade as-is to match your file.
    return this.ctrl.setSuggestions("pickup", list);
  }

  setDeliverySuggestions(list) {
    // This method (setSuggestions) doesn't exist on CorrectionEditorController
    return this.ctrl.setSuggestions("delivery", list);
  }

  acceptPickupSuggestion(i = 0) {
    const r = this.ctrl.acceptSuggestion("pickup", i);
    // --- UPDATED: Pass side to previewer ---
    if (this.preview && r.ok) this.preview.show("pickup", this.ctrl.snapshot().editor.editedPickup);
    return r.ok ? Result.ok(true) : r;
  }

  acceptDeliverySuggestion(i = 0) {
    const r = this.ctrl.acceptSuggestion("delivery", i);
    // --- UPDATED: Pass side to previewer ---
    if (this.preview && r.ok) this.preview.show("delivery", this.ctrl.snapshot().editor.editedDelivery);
    return r.ok ? Result.ok(true) : r;
  }

  useOriginalPickup() {
    return this.ctrl.useOriginal("pickup");
  }

  useOriginalDelivery() {
    return this.ctrl.useOriginal("delivery");
  }

  /**
   * Geocodes the *edited* address for a given side and focuses the map.
   * This is called when the user clicks the "Geocode" button.
   * @param {'pickup' | 'delivery'} side
   */
  async geocodeAndFocus(side) {
    const geocodeResult = await this.ctrl.geocodeEdited(side);
    if (!geocodeResult.ok) {
      return geocodeResult;
    }

    // Now focus the map on the newly geocoded point
    const snap = this.ctrl.snapshot();
    const addr = (side === 'pickup') ? snap.editor.editedPickup : snap.editor.editedDelivery;
    if (this.preview) {
      await this.preview.policy.focusAddress(side, addr);
    }

    return geocodeResult;
  }

  /**
   * Refreshes the route on the map using the *current* coordinates
   * from the editor state.
   */
  async refreshRoute() {
    if (!this.preview) {
      return Result.fail(new Error("Map controller not available."));
    }
    try {
      const snap = this.ctrl.snapshot();
      if (snap.editor.editedPickup && snap.editor.editedDelivery) {
        log.info("[EditorFacade] Refreshing map route.");
        await this.preview.policy.showAndFitRoute(
            snap.editor.editedPickup,
            snap.editor.editedDelivery
        );
        return Result.ok(true);
      } else {
        return Result.fail(new Error("Missing pickup or delivery address."));
      }
    } catch (e) {
      log.error("[EditorFacade] Failed to refresh map route:", e);
      return Result.fail(e);
    }
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};