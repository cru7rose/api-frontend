/**
 * ARCHITECTURE: SessionStorageService persists small JSON blobs across reloads within the session.
 * It follows the manifesto by isolating storage read/write and providing safe JSON handling.
 * Responsibilities:
 * - Save and load values by key with automatic JSON serialization and prefixing to avoid collisions.
 * - Provide remove and clearNamespace utilities without affecting unrelated storage.
 */
export class SessionStorageService {
  constructor(namespace = "wb") {
    this.ns = namespace;
    this._prefix = `${this.ns}:`;
    this._store = typeof window !== "undefined" ? window.sessionStorage : null;
  }

  save(key, value) {
    if (!this._store) return false;
    this._store.setItem(this._prefix + key, JSON.stringify(value == null ? null : value));
    return true;
  }

  load(key, fallback = null) {
    if (!this._store) return fallback;
    const raw = this._store.getItem(this._prefix + key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  remove(key) {
    if (!this._store) return false;
    this._store.removeItem(this._prefix + key);
    return true;
  }

  clearNamespace() {
    if (!this._store) return 0;
    const keys = [];
    for (let i = 0; i < this._store.length; i++) {
      const k = this._store.key(i);
      if (k && k.startsWith(this._prefix)) keys.push(k);
    }
    keys.forEach(k => this._store.removeItem(k));
    return keys.length;
  }
}
