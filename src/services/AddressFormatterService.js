/**
 * ARCHITECTURE: AddressFormatterService produces consistent, locale-aware display strings for addresses.
 * It follows the manifesto by separating presentation formatting from data models and controllers.
 * Responsibilities:
 * - Format single-line and multi-line address strings with optional fallbacks.
 * - Handle missing fields gracefully and avoid mutating inputs.
 */
export class AddressFormatterService {
  constructor(defaultCountry = "PL") {
    this.defaultCountry = defaultCountry;
  }

  oneLine(a) {
    if (!a) return "";
    const parts = [];
    const line1 = [a.street, a.houseNumber].filter(Boolean).join(" ").trim();
    if (line1) parts.push(line1);
    const line2 = [a.postalCode, a.city].filter(Boolean).join(" ").trim();
    if (line2) parts.push(line2);
    const c = a.country || this.defaultCountry;
    if (c) parts.push(c);
    return parts.join(", ");
  }

  twoLines(a) {
    if (!a) return { line1: "", line2: "" };
    const line1 = [a.street, a.houseNumber].filter(Boolean).join(" ").trim();
    const line2 = [[a.postalCode, a.city].filter(Boolean).join(" ").trim(), a.country || this.defaultCountry].filter(Boolean).join(", ");
    return { line1, line2 };
  }
}
