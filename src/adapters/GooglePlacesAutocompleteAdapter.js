// FILE: src/adapters/GooglePlacesAutocompleteAdapter.js
// KEPT AS IS (from previous restore) - needed for optional Google usage
import { GooglePlacesSessionManager } from "@/adapters/GooglePlacesSessionManager";

/**
 * ARCHITECTURE: GooglePlacesAutocompleteAdapter wraps Places Autocomplete for type-ahead hints.
 * Isolates vendor API calls and returns normalized suggestion DTOs.
 */
export class GooglePlacesAutocompleteAdapter {
  constructor(googleObj) {
    if (!googleObj || !googleObj.maps || !googleObj.maps.places) {
      throw new Error("GooglePlacesAutocompleteAdapter: google maps places library required.");
    }
    this.google = googleObj;
    this.service = new this.google.maps.places.AutocompleteService();
    const mapDiv = (typeof document !== 'undefined') ? document.createElement("div") : null;
    this.detailsService = mapDiv ? new this.google.maps.places.PlacesService(mapDiv) : null;
    this.sessionManager = new GooglePlacesSessionManager(this.google);
  }

  async suggest(text, country = "PL") {
    // ... (implementation kept from previous restore) ...
    if (!this.service || !text || !text.trim()) return [];
    log.debug(`[GooglePlaces] Suggesting for: "${text}"`);
    const sessionToken = this.sessionManager.getToken();
    if (!sessionToken) {
      log.warn("[GooglePlaces] No session token available for suggestion.");
      this.sessionManager.renew();
      return [];
    }
    try {
      const predictions = await this._getPredictions(text, country, sessionToken);
      const predictionItems = Array.isArray(predictions) ? predictions.slice(0, 5) : [];
      const detailPromises = predictionItems.map(p => this._getDetails(p.place_id, sessionToken));
      const detailedResults = await Promise.all(detailPromises);
      const enriched = detailedResults
          .filter(d => d !== null)
          .map(d => this._mapDetailsToSuggestion(d));
      if (enriched.length > 0) {
        this.sessionManager.renew();
        log.debug(`[GooglePlaces] Session token renewed after fetching ${enriched.length} details.`);
      }
      return enriched;
    } catch (error) {
      log.error(`[GooglePlaces] Suggestion error for "${text}": ${error.message}`, error);
      return [];
    }
  }

  _getPredictions(input, country, sessionToken) {
    // ... (implementation kept from previous restore) ...
    return new Promise((resolve, reject) => {
      if (!this.service) return reject(new Error("Places AutocompleteService not initialized."));
      this.service.getPlacePredictions(
          { input, sessionToken, componentRestrictions: { country }, types: ['address'] },
          (predictions, status) => {
            if (status === this.google.maps.places.PlacesServiceStatus.OK) { resolve(predictions || []); }
            else if (status === this.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) { resolve([]); }
            else {
              log.warn(`[GooglePlaces] getPlacePredictions failed with status: ${status}`);
              reject(new Error(`Places Autocomplete prediction failed: ${status}`));
            }
          }
      );
    });
  }

  _getDetails(placeId, sessionToken) {
    // ... (implementation kept from previous restore) ...
    return new Promise((resolve) => {
      if (!this.detailsService) { log.error("[GooglePlaces] PlacesService for details not initialized."); return resolve(null); }
      if (!placeId) return resolve(null);
      this.detailsService.getDetails(
          { placeId, sessionToken, fields: ["address_components", "geometry.location", "formatted_address"] },
          (place, status) => {
            if (status === this.google.maps.places.PlacesServiceStatus.OK && place) { resolve(place); }
            else { log.warn(`[GooglePlaces] getDetails failed for placeId ${placeId} with status: ${status}`); resolve(null); }
          }
      );
    });
  }

  _mapDetailsToSuggestion(place) {
    // ... (implementation kept from previous restore) ...
    if (!place) return null;
    const comps = this._indexComponents(place.address_components || []);
    const lat = place.geometry?.location?.lat?.() ?? null;
    const lon = place.geometry?.location?.lng?.() ?? null;
    return {
      fullAddressLabel: place.formatted_address || null,
      street: comps.route || null, houseNumber: comps.street_number || null,
      postalCode: comps.postal_code || null, city: comps.locality || comps.postal_town || comps.administrative_area_level_2 || null,
      countryCode: comps.country_code || null, countryName: comps.country || null,
      latitude: lat, longitude: lon,
      matchScore: 0.9, matchLevel: "PLACES_DETAIL", providerSource: "GOOGLE_PLACES",
    };
  }

  _indexComponents(parts) {
    // ... (implementation kept from previous restore) ...
    const map = {};
    for (const c of parts) {
      for (const t of c.types) {
        if (t === "country") { map.country = c.long_name; map.country_code = c.short_name; }
        else if (t === "locality") { map.locality = c.long_name; }
        else if (t === "postal_town") { map.postal_town = c.long_name; }
        else if (t === "administrative_area_level_2") { map.administrative_area_level_2 = c.long_name; }
        else if (t === "route") { map.route = c.long_name; }
        else if (t === "street_number") { map.street_number = c.long_name; }
        else if (t === "postal_code") { map.postal_code = c.long_name; }
      }
    }
    return map;
  }
}

const log = {
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};