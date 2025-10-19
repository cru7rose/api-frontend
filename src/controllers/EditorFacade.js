/**
 * ARCHITECTURE: EditorFacade wraps CorrectionEditorController and adds map preview conveniences.
 * It follows the manifesto by exposing intent methods used by the Editor view without leaking internals.
 * Responsibilities:
 * - Load order, set manual edits, accept suggestions, and compute snapshots for UI.
 * - Optionally preview on map when accepting/applying suggestions.
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
    return await this.ctrl.loadOrder(orderId);
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
    return this.ctrl.setSuggestions("pickup", list);
  }

  setDeliverySuggestions(list) {
    return this.ctrl.setSuggestions("delivery", list);
  }

  acceptPickupSuggestion(i = 0) {
    const r = this.ctrl.acceptSuggestion("pickup", i);
    if (this.preview && r.ok) this.preview.show(this.ctrl.snapshot().editedPickup);
    return r.ok ? Result.ok(true) : r;
  }

  acceptDeliverySuggestion(i = 0) {
    const r = this.ctrl.acceptSuggestion("delivery", i);
    if (this.preview && r.ok) this.preview.show(this.ctrl.snapshot().editedDelivery);
    return r.ok ? Result.ok(true) : r;
  }

  useOriginalPickup() {
    return this.ctrl.useOriginal("pickup");
  }

  useOriginalDelivery() {
    return this.ctrl.useOriginal("delivery");
  }
}
