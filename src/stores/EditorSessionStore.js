/**
 * ARCHITECTURE: EditorSessionStore preserves cross-view context for the Correction Editor.
 * It follows the manifesto by providing a simple, framework-agnostic state carrier.
 * Responsibilities:
 * - Remember the last worklist filter snapshot and the current orderId under edit.
 * - Expose methods to persist/restore navigation context and support "Save & Next".
 */
export class EditorSessionStore {
  constructor() {
    this.lastFilterSnapshot = null;
    this.currentOrderId = null;
  }

  setFilterSnapshot(snapshot) {
    this.lastFilterSnapshot = snapshot ? { ...snapshot } : null;
    return this.lastFilterSnapshot;
  }

  setCurrentOrder(orderId) {
    this.currentOrderId = orderId || null;
    return this.currentOrderId;
  }

  clear() {
    this.lastFilterSnapshot = null;
    this.currentOrderId = null;
  }

  snapshot() {
    return {
      lastFilterSnapshot: this.lastFilterSnapshot,
      currentOrderId: this.currentOrderId,
    };
  }
}
