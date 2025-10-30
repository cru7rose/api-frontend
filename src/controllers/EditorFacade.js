// ============================================================================
// Frontend: Update EditorFacade.js (Supersedes previous version)
// FILE: src/controllers/EditorFacade.js
// REASON: Added 'log' shim for console logging.
// ============================================================================
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
    // --- NEW: Draw markers and route on load ---
    if (loadResult.ok && this.preview) {
      try {
        const snap = this.ctrl.snapshot();
        // Use editedPickup/Delivery which are initialized from the originals
        if (snap.editedPickup && snap.editedDelivery) {
          log.info("[EditorFacade] Loading complete. Drawing initial markers and route.");
          await this.preview.policy.showAndFitRoute(
              snap.editedPickup,
              snap.editedDelivery
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
    if (this.preview && r.ok) this.preview.show("pickup", this.ctrl.snapshot().editedPickup);
    return r.ok ? Result.ok(true) : r;
  }

  acceptDeliverySuggestion(i = 0) {
    const r = this.ctrl.acceptSuggestion("delivery", i);
    // --- UPDATED: Pass side to previewer ---
    if (this.preview && r.ok) this.preview.show("delivery", this.ctrl.snapshot().editedDelivery);
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
    const addr = (side === 'pickup') ? snap.editedPickup : snap.editedDelivery;
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
      if (snap.editedPickup && snap.editedDelivery) {
        log.info("[EditorFacade] Refreshing map route.");
        await this.preview.policy.showAndFitRoute(
            snap.editedPickup,
            snap.editedDelivery
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

// *** ADDED LOG SHIM ***
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
// *** END LOG SHIM ***