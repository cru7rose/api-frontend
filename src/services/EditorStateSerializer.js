/**
 * ARCHITECTURE: EditorStateSerializer persists and restores editor state across reloads in session storage.
 * It follows the manifesto by isolating serialization concerns and avoiding component-level side effects.
 * Responsibilities:
 * - Save minimal editor payload keyed by orderId; restore and clear on demand.
 * - Handle safe JSON parse/stringify and namespace keys to avoid collisions.
 */
export class EditorStateSerializer {
  constructor(namespace = "editor") {
    this.ns = namespace;
    this._store = typeof window !== "undefined" ? window.sessionStorage : null;
  }

  save(orderId, state) {
    if (!this._store || !orderId) return false;
    const key = this._key(orderId);
    const payload = {
      at: Date.now(),
      editedPickup: state?.editedPickup || null,
      editedDelivery: state?.editedDelivery || null,
    };
    this._store.setItem(key, JSON.stringify(payload));
    return true;
  }

  load(orderId) {
    if (!this._store || !orderId) return null;
    const raw = this._store.getItem(this._key(orderId));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  clear(orderId) {
    if (!this._store || !orderId) return false;
    this._store.removeItem(this._key(orderId));
    return true;
  }

  _key(orderId) {
    return `${this.ns}:${orderId}`;
  }
}
