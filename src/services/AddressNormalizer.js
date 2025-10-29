/**
 * ARCHITECTURE: AddressNormalizer sanitizes raw address input into a consistent DTO used by verification.
 * It follows the manifesto by providing pure, deterministic transformations without UI or transport coupling.
 * Responsibilities:
 * - Trim whitespace, stabilize casing, and normalize postal code for PL (e.g., "00123" → "00-123").
 * - Guarantee presence of all expected fields with safe defaults.
 *
 * FIX: Removed erroneous circular self-import statement.
 */

export class AddressNormalizer {
  constructor(defaultCountry = "PL") {
    this.defaultCountry = defaultCountry.toUpperCase();
  }

  normalize(a) {
    const street = this._sp(a?.street);
    const houseNumber = this._hn(a?.houseNumber);
    const city = this._cap(this._sp(a?.city));
    const country = this._cc(a?.country);
    const postalCode = this._postal(a?.postalCode, country);
    const latitude = this._num(a?.latitude);
    const longitude = this._num(a?.longitude);
    return { street, houseNumber, postalCode, city, country, latitude, longitude };
  }

  _sp(v) {
    return (v || "").toString().replace(/\s+/g, " ").trim();
  }

  _hn(v) {
    const s = (v == null ? "" : String(v)).replace(/\s+/g, "").trim();
    return s.length ? s : null;
  }

  _cap(v) {
    if (!v) return "";
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  _cc(v) {
    const s = (v || this.defaultCountry).toString().trim().toUpperCase();
    return s || this.defaultCountry;
  }

  _postal(v, country) {
    const raw = (v || "").replace(/\s|-/g, "");
    if ((country || "").toUpperCase() === "PL") {
      if (raw.length < 5) return raw;
      return `${raw.slice(0, 2)}-${raw.slice(2, 5)}`;
    }
    return v || "";
  }

  _num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}
