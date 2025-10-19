/**
 * ARCHITECTURE: EditorFocusController manages a deterministic focus order across address fields.
 * It follows the manifesto by isolating focus logic from the component and DOM details.
 * Responsibilities:
 * - Provide nextField() and prevField() given current key and an ordered schema.
 * - Return the target key for the view to focus without touching the DOM.
 */
export class EditorFocusController {
  constructor(order = ["street", "houseNumber", "postalCode", "city", "country"]) {
    this.order = order.slice();
    this.index = 0;
  }

  setCurrent(key) {
    const idx = this.order.indexOf(key);
    if (idx >= 0) this.index = idx;
    return this.current();
  }

  current() {
    return this.order[this.index] || null;
  }

  next() {
    this.index = Math.min(this.order.length - 1, this.index + 1);
    return this.current();
  }

  previous() {
    this.index = Math.max(0, this.index - 1);
    return this.current();
  }

  reset() {
    this.index = 0;
    return this.current();
  }
}
