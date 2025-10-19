/**
 * ARCHITECTURE: MapGeocoderAdapter abstracts a geocoding function behind a stable contract.
 * It follows the manifesto by isolating vendor-specific logic and exposing a single responsibility.
 * Responsibilities:
 * - Accept an Address-like DTO and delegate to an injected geocode function.
 * - Return a normalized { lat, lon } object or null without leaking provider details.
 */
export class MapGeocoderAdapter {
  constructor(geocodeFn) {
    if (typeof geocodeFn !== "function") throw new Error("MapGeocoderAdapter: geocode function required.");
    this.geocodeFn = geocodeFn;
  }

  async geocodeAddress(address) {
    if (!address || typeof address !== "object") return null;
    const r = await this.geocodeFn({
      street: address.street,
      houseNumber: address.houseNumber ?? null,
      postalCode: address.postalCode,
      city: address.city,
      country: address.country || "PL",
    });
    if (!r || typeof r.lat !== "number" || typeof r.lon !== "number") return null;
    return { lat: r.lat, lon: r.lon };
  }
}
