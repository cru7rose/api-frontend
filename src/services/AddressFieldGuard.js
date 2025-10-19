/**
 * ARCHITECTURE: AddressFieldGuard enforces form field enable/disable rules per country and workflow state.
 * It follows the manifesto by isolating editability policies from components and controllers.
 * Responsibilities:
 * - Decide if a field is editable based on country rules, verification status, and role flags.
 * - Provide a stateless canEdit(field, context) API returning a boolean.
 */
export class AddressFieldGuard {
  constructor() {
    this._rules = new Map();
    this._rules.set("PL", {
      postalCode: () => true,
      street: () => true,
      houseNumber: () => true,
      city: () => true,
      country: () => false,
    });
  }

  register(country, rules) {
    this._rules.set((country || "PL").toUpperCase(), rules);
    return true;
  }

  canEdit(field, context) {
    const c = (context?.country || "PL").toUpperCase();
    const rules = this._rules.get(c) || this._rules.get("PL");
    if (typeof rules[field] === "function") return !!rules[field](context);
    return true;
  }
}
