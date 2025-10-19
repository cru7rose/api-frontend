/**
 * ARCHITECTURE: ErrorTypeDictionary maps backend error codes to user-facing labels and severities.
 * It follows the manifesto by isolating presentation-neutral taxonomy from API DTOs.
 * Responsibilities:
 * - Provide stable lookups for label, severity, and suggested actions per error type.
 * - Allow extension via register() without changing existing mappings.
 */
export class ErrorTypeDictionary {
  constructor() {
    this._map = new Map();
    this._map.set("INVALID_POSTAL_CODE", { label: "Invalid ZIP/Postal Code", severity: "critical", actions: ["verify", "fix-postal"] });
    this._map.set("AMBIGUOUS_STREET", { label: "Ambiguous Street (Apt/Suite missing)", severity: "warning", actions: ["add-apartment", "verify"] });
    this._map.set("NON_STANDARDIZED", { label: "Non-standardized Address", severity: "info", actions: ["normalize", "verify"] });
  }

  get(code) {
    return this._map.get(code) || { label: code || "Unknown Error", severity: "info", actions: [] };
  }

  register(code, entry) {
    if (!code || typeof entry !== "object") throw new Error("ErrorTypeDictionary: invalid registration.");
    this._map.set(code, entry);
    return true;
  }
}
