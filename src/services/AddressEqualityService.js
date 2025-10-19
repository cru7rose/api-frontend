/**
 * ARCHITECTURE: AddressEqualityService computes structural equality and a stable hash for Address DTOs.
 * It follows the manifesto by providing deterministic comparisons without UI or transport concerns.
 * Responsibilities:
 * - Compare two addresses field-by-field with normalization of whitespace and case.
 * - Produce a hash string for use in caches, audit, or deduplication logic.
 */
export class AddressEqualityService {
  constructor() {
    this._fields = ["street", "houseNumber", "postalCode", "city", "country", "latitude", "longitude"];
  }

  equals(a, b) {
    if (!a || !b) return false;
    for (const f of this._fields) {
      if (!this._eq(a[f], b[f])) return false;
    }
    return true;
  }

  hash(a) {
    const s = (x) => (x == null ? "" : String(x).trim().toLowerCase());
    const n = (x) => (typeof x === "number" ? x.toFixed(6) : "");
    const parts = [
      s(a?.street),
      s(a?.houseNumber),
      s(a?.postalCode),
      s(a?.city),
      s(a?.country),
      n(a?.latitude),
      n(a?.longitude),
    ];
    return this._simpleHash(parts.join("|"));
  }

  _eq(a, b) {
    if (typeof a === "number" || typeof b === "number") {
      return Number(a || 0).toFixed(6) === Number(b || 0).toFixed(6);
    }
    return (a || "").toString().trim().toLowerCase() === (b || "").toString().trim().toLowerCase();
  }

  _simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return `h${(h >>> 0).toString(16)}`;
  }
}
