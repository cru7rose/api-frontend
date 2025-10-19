/**
 * ARCHITECTURE: GoogleGeocodingAdapter wraps the Maps JS Geocoder into a provider-agnostic API.
 * It follows the manifesto by providing a single responsibility: address → {lat,lon,normalizedFields}.
 * Responsibilities:
 * - Accept Address-like input and call google.maps.Geocoder.
 * - Normalize results into a plain object usable by the Editor (street, houseNumber, postalCode, city, country, lat, lon).
 */
export class GoogleGeocodingAdapter {
  constructor(googleObj) {
    this.google = googleObj;
    this.geocoder = new this.google.maps.Geocoder();
  }

  async geocodeAddress(address) {
    if (!address || !address.street || !address.postalCode || !address.city) {
      return null;
    }
    const line1 = address.houseNumber ? `${address.street} ${address.houseNumber}` : address.street;
    const country = address.country || "PL";
    const query = `${line1}, ${address.postalCode} ${address.city}, ${country}`;
    const res = await this.geocoder.geocode({ address: query });
    if (!res || !Array.isArray(res.results) || res.results.length === 0) {
      return null;
    }
    const best = res.results[0];
    const components = this._indexComponents(best.address_components || []);
    const normalized = {
      street: components.route || address.street,
      houseNumber: components.street_number || address.houseNumber || null,
      postalCode: components.postal_code || address.postalCode,
      city: components.locality || components.postal_town || components.administrative_area_level_2 || address.city,
      country: components.country_code || country,
      latitude: best.geometry?.location?.lat?.() ?? null,
      longitude: best.geometry?.location?.lng?.() ?? null,
    };
    return normalized;
  }

  _indexComponents(parts) {
    const map = {};
    for (const c of parts) {
      for (const t of c.types) {
        if (t === "country") {
          map.country = c.long_name;
          map.country_code = c.short_name;
        } else if (t === "locality") {
          map.locality = c.long_name;
        } else if (t === "postal_town") {
          map.postal_town = c.long_name;
        } else if (t === "administrative_area_level_2") {
          map.administrative_area_level_2 = c.long_name;
        } else if (t === "route") {
          map.route = c.long_name;
        } else if (t === "street_number") {
          map.street_number = c.long_name;
        } else if (t === "postal_code") {
          map.postal_code = c.long_name;
        }
      }
    }
    return map;
  }
}
