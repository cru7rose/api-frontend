/**
 * ARCHITECTURE: WorklistSelectionController manages single, multi, and range selections in the grid.
 * It follows the manifesto by isolating selection math from visual components.
 * Responsibilities:
 * - Toggle, select range with anchors, and expose a stable array of selected IDs.
 */
export class WorklistSelectionController {
  constructor() {
    this._selected = new Set();
    this._lastAnchorIndex = null;
  }

  toggle(id, index) {
    if (this._selected.has(id)) this._selected.delete(id);
    else this._selected.add(id);
    this._lastAnchorIndex = typeof index === "number" ? index : this._lastAnchorIndex;
    return this.ids();
  }

  set(ids) {
    this._selected = new Set(Array.isArray(ids) ? ids : []);
    return this.ids();
  }

  clear() {
    this._selected.clear();
    this._lastAnchorIndex = null;
    return [];
  }

  range(allIds, toIndex) {
    if (!Array.isArray(allIds) || typeof this._lastAnchorIndex !== "number" || typeof toIndex !== "number") return this.ids();
    const [a, b] = [this._lastAnchorIndex, toIndex].sort((x, y) => x - y);
    for (let i = a; i <= b; i++) this._selected.add(allIds[i]);
    return this.ids();
  }

  ids() {
    return Array.from(this._selected.values());
  }
}
