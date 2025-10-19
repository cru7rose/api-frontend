/**
 * ARCHITECTURE: AddressRulesService centralizes country-specific rules for required fields and masks.
 * It follows the manifesto by separating rule data from controllers and adapters.
 * Responsibilities:
 * - Provide requiredFields(country) and postalRegex(country) for validation and hints.
 */
export class AddressRulesService {
  constructor() {
    this._req = new Map();
    this._req.set("PL", ["street", "postalCode", "city", "country"]);
    this._postal = new Map();
    this._postal.set("PL", /^(\d{2}-\d{3}|\d{5})$/);
  }

  requiredFields(country = "PL") {
    return this._req.get((country || "PL").toUpperCase()) || this._req.get("PL");
  }

  postalRegex(country = "PL") {
    return this._postal.get((country || "PL").toUpperCase()) || /.*/;
  }
}
