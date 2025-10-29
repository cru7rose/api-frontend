// FILE: src/adapters/GoogleGeocodingAdapter.js
// KEPT AS IS (from previous restore) - needed for optional Google usage
/**
 * ARCHITECTURE: GoogleGeocodingAdapter wraps the Maps JS Geocoder into a provider-agnostic API.
 * Provides address → {lat, lon, normalizedFields}.
 */
export class GoogleGeocodingAdapter {
  constructor(googleObj) {
    if (!googleObj || !googleObj.maps) throw new Error("GoogleGeocodingAdapter: google maps object required.");
    this.google = googleObj;
    this.geocoder = new this.google.maps.Geocoder();
  }

  async geocodeAddress(address) {
    // ... (implementation kept from previous restore) ...
    if (!address || !address.street || !address.postalCode || !address.city) {
      console.warn("[GoogleGeocode] Geocode skipped: Missing required fields.");
      return null;
    }
    const line1 = address.houseNumber ? `${address.street} ${address.houseNumber}` : address.street;
    const country = address.country || "PL";
    const query = `${line1}, ${address.postalCode} ${address.city}, ${country}`;
    const request = { address: query, region: country };
    log.debug(`[GoogleGeocode] Geocoding query: ${query}`);

    try {
      const res = await this.geocoder.geocode(request);
      if (!res || !Array.isArray(res.results) || res.results.length === 0) {
        log.warn(`[GoogleGeocode] No results found for query: ${query}`);
        return null;
      }
      const best = res.results[0];
      const components = this._indexComponents(best.address_components || []);
      const lat = best.geometry?.location?.lat?.() ?? null;
      const lon = best.geometry?.location?.lng?.() ?? null;

      if (lat == null || lon == null) {
        log.warn(`[GoogleGeocode] Result for query '${query}' missing valid coordinates.`);
        return null;
      }
      const normalized = {
        street: components.route || address.street || null,
        houseNumber: components.street_number || address.houseNumber || null,
        postalCode: components.postal_code || address.postalCode || null,
        city: components.locality || components.postal_town || components.administrative_area_level_2 || address.city || null,
        country: components.country_code || country,
        latitude: lat,
        longitude: lon,
        _provider: 'Google',
        _displayName: best.formatted_address,
        _confidence: best.geometry?.location_type === 'ROOFTOP' ? 1.0 : (best.geometry?.location_type === 'RANGE_INTERPOLATED' ? 0.9 : 0.7),
        _locationType: best.geometry?.location_type
      };
      log.debug(`[GoogleGeocode] Geocode success for query '${query}'. Result: Lat=${normalized.latitude}, Lon=${normalized.longitude}, Type=${normalized._locationType}`);
      return normalized;

    } catch (error) {
      log.error(`[GoogleGeocode] Geocoding error for query '${query}': ${error.message}`, error);
      return null;
    }
  }

  _indexComponents(parts) {
    // ... (implementation kept from previous restore) ...
    const map = {};
    for (const c of parts) {
      for (const t of c.types) {
        if (t === "country") {
          map.country = c.long_name; map.country_code = c.short_name;
        } else if (t === "locality") { map.locality = c.long_name;
        } else if (t === "postal_town") { map.postal_town = c.long_name;
        } else if (t === "administrative_area_level_2") { map.administrative_area_level_2 = c.long_name;
        } else if (t === "administrative_area_level_1") { map.administrative_area_level_1 = c.long_name;
        } else if (t === "route") { map.route = c.long_name;
        } else if (t === "street_number") { map.street_number = c.long_name;
        } else if (t === "postal_code") { map.postal_code = c.long_name; }
      }
    }
    return map;
  }
}

const log = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};