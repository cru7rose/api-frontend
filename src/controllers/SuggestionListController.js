/**
 * ARCHITECTURE: SuggestionListController manages selection and application of ranked suggestions.
 * It follows the manifesto by isolating list state from UI and delegating application to EditorFacade.
 * Responsibilities:
 * - Hold a cursor over suggestions, navigate next/prev, and apply current suggestion to pickup or delivery.
 * - Coordinate map viewport focusing for visual confirmation.
 */
import { SuggestionSelectionController } from "@/controllers/SuggestionSelectionController";
import { MapViewportPolicyController } from "@/controllers/MapViewportPolicyController";

export class SuggestionListController {
  constructor(editorFacade, mapController) {
    this.editor = editorFacade;
    this.selector = new SuggestionSelectionController();
    this.viewport = new MapViewportPolicyController(mapController);
    this.items = [];
    this.index = -1;
  }

  load(list) {
    this.items = Array.isArray(list) ? list.slice() : [];
    this.index = this.items.length ? 0 : -1;
    return this.snapshot();
  }

  select(i) {
    if (typeof i !== "number" || i < 0 || i >= this.items.length) return this.snapshot();
    this.index = i;
    return this.snapshot();
  }

  next() {
    if (this.items.length === 0) return this.snapshot();
    this.index = Math.min(this.items.length - 1, this.index + 1);
    return this.snapshot();
  }

  prev() {
    if (this.items.length === 0) return this.snapshot();
    this.index = Math.max(0, this.index - 1);
    return this.snapshot();
  }

  async applyTo(side = "pickup") {
    if (this.index < 0 || this.index >= this.items.length) return false;
    const sel = { index: this.index, suggestion: this.items[this.index] };
    const ok = this.selector.accept(this.editor, side, sel);
    if (ok) await this.viewport.focusSuggestion(sel.suggestion);
    return ok;
  }

  snapshot() {
    return {
      items: this.items.slice(),
      index: this.index,
      current: this.index >= 0 ? this.items[this.index] : null,
    };
  }
}
