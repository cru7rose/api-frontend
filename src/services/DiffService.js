/**
 * ARCHITECTURE: DiffService computes before/after differences for Address DTO fields.
 * It follows the manifesto by isolating comparison logic from viewmodels and controllers.
 * Responsibilities:
 * - Compare two objects field-by-field; return {entries[], anyChanged}.
 */
export class DiffService {
  constructor(fields = ["street", "houseNumber", "postalCode", "city", "country", "latitude", "longitude"]) {
    this.fields = fields.slice();
  }

  diff(before, after) {
    const entries = this.fields.map(f => {
      const b = this._val(before, f);
      const a = this._val(after, f);
      const changed = !this._eq(b, a);
      return { field: f, before: b, after: a, changed };
    });
    const anyChanged = entries.some(e => e.changed);
    return { entries, anyChanged };
  }

  _val(obj, field) {
    if (!obj) return null;
    return obj[field] ?? null;
  }

  _eq(a, b) {
    if (typeof a === "number" || typeof b === "number") return Number(a || 0).toFixed(6) === Number(b || 0).toFixed(6);
    return (a || "").toString().trim().toLowerCase() === (b || "").toString().trim().toLowerCase();
  }
}
