/**
 * ARCHITECTURE: GooglePlacesAutocompleteAdapter wraps Places Autocomplete for type-ahead address hints.
 * It follows the manifesto by isolating vendor-specific API calls and returning normalized suggestion DTOs.
 * Responsibilities:
 * - Create and reuse a session token, query AutocompleteService, and detail lookup for precise fields.
 * - Normalize results into street, houseNumber, postalCode, city, country, latitude, longitude.
 */
export class GooglePlacesAutocompleteAdapter {
  constructor(googleObj) {
    if (!googleObj || !googleObj.maps) throw new Error("GooglePlacesAutocompleteAdapter: google maps object required.");
    this.google = googleObj;
    this.service = new this.google.maps.places.AutocompleteService();
    this.details = new this.google.maps.places.PlacesService(document.createElement("div"));
    this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
  }

  async suggest(text, country = "PL") {
    if (!text || !text.trim()) return [];
    const r = await this._getPredictions(text, country);
    const picks = Array.isArray(r) ? r.slice(0, 5) : [];
    const enriched = [];
    for (const p of picks) {
      const d = await this._getDetails(p.place_id);
      if (d) {
        enriched.push(d);
      }
    }
    return enriched;
  }

  async _getPredictions(input, country) {
    return new Promise((resolve, reject) => {
      this.service.getPlacePredictions(
        { input, sessionToken: this.sessionToken, componentRestrictions: { country } },
        (predictions, status) => {
          if (status !== this.google.maps.places.PlacesServiceStatus.OK || !predictions) return resolve([]);
          resolve(predictions);
        }
      );
    });
  }

  async _getDetails(placeId) {
    return new Promise((resolve) => {
      this.details.getDetails({ placeId, sessionToken: this.sessionToken, fields: ["address_components", "geometry"] }, (place, status) => {
        if (status !== this.google.maps.places.PlacesServiceStatus.OK || !place) return resolve(null);
        const comps = this._indexComponents(place.address_components || []);
        resolve({
          fullAddressLabel: null,
          street: comps.route || null,
          houseNumber: comps.street_number || null,
          postalCode: comps.postal_code || null,
          city: comps.locality || comps.postal_town || comps.administrative_area_level_2 || null,
          countryCode: comps.country_code || null,
          countryName: comps.country || null,
          latitude: place.geometry?.location?.lat?.() ?? null,
          longitude: place.geometry?.location?.lng?.() ?? null,
          matchScore: 0.9,
          matchLevel: "PLACES",
          providerSource: "GOOGLE_PLACES",
        });
      });
    });
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
