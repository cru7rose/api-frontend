// ============================================================================
// Frontend: Update domain/WorkbenchModels.js
// REASON: Add 'alias' and 'name' fields to the Address model.
// ============================================================================
/**
 * ARCHITECTURE: WorkbenchModels define immutable value objects used by the editor and worklist.
 * It follows the manifesto by centralizing simple data models away from transport and views.
 * Responsibilities:
 * - Provide Address with factory helpers to ensure safe defaults and cloning.
 * - Offer toPlain() for persistence mapping without leaking internal structure.
 * UPDATED: Added 'name' and 'alias' fields.
 */
export class Address {
  constructor({ street = "", houseNumber = null, postalCode = "", city = "", country = "PL", latitude = null, longitude = null, name = null, alias = null } = {}) {
    this.street = street || "";
    this.houseNumber = houseNumber || null;
    this.postalCode = postalCode || "";
    this.city = city || "";
    this.country = country || "PL";
    this.latitude = typeof latitude === "number" ? latitude : null;
    this.longitude = typeof longitude === "number" ? longitude : null;
    // --- NEW FIELDS ---
    this.name = name || null;
    this.alias = alias || null;
    // --- END NEW FIELDS ---
  }

  static from(obj) {
    if (!obj || typeof obj !== "object") return new Address();
    return new Address({
      street: obj.street,
      houseNumber: obj.houseNumber,
      postalCode: obj.postalCode,
      city: obj.city,
      country: obj.country,
      latitude: obj.latitude,
      longitude: obj.longitude,
      // --- NEW FIELDS ---
      name: obj.name,
      alias: obj.alias,
      // --- END NEW FIELDS ---
    });
  }

  clone() {
    return new Address(this);
  }

  toPlain() {
    return {
      street: this.street,
      houseNumber: this.houseNumber,
      postalCode: this.postalCode,
      city: this.city,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      // --- NEW FIELDS ---
      name: this.name,
      alias: this.alias,
      // --- END NEW FIELDS ---
    };
  }
}