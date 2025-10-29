// FILE: src/services/SuggestionNormalizer.js
/**
 * ARCHITECTURE: SuggestionNormalizer converts heterogeneous provider responses into a unified Suggestion DTO.
 * It follows the manifesto by isolating mapping/normalization concerns and avoiding provider leakage into UI.
 * Responsibilities:
 * - Accept raw Google Geocoder/Places or TES suggestion objects and output a normalized shape.
 * - Provide batch normalization and safe defaults for missing fields.
 *
 * FIX: Removed erroneous circular self-import statement.
 */
// REMOVED: import { SuggestionNormalizer } from "@/services/SuggestionNormalizer";

export class SuggestionNormalizer {
  constructor(defaultCountry = "PL") {
    this.defaultCountry = defaultCountry;
  }

  fromGoogleGeocoder(geo) {
    if (!geo) return null;
    const comp = this._indexComponents(geo.address_components || []);
    return {
      fullAddressLabel: geo.formatted_address || null,
      street: comp.route ||
          null,
      houseNumber: comp.street_number || null,
      postalCode: comp.postal_code ||
          null,
      city: comp.locality || comp.postal_town || comp.administrative_area_level_2 ||
          null,
      countryCode: comp.country_code || this.defaultCountry,
      countryName: comp.country ||
          null,
      latitude: geo.geometry?.location?.lat?.() ?? null,
      longitude: geo.geometry?.location?.lng?.() ??
          null,
      matchScore: 0.95,
      matchLevel: "GEOCODER",
      providerSource: "GOOGLE_CLIENT",
    };
  }

  fromGooglePlaces(place) {
    if (!place) return null;
    const comp = this._indexComponents(place.address_components || []);
    return {
      fullAddressLabel: null,
      street: comp.route ||
          null,
      houseNumber: comp.street_number || null,
      postalCode: comp.postal_code ||
          null,
      city: comp.locality || comp.postal_town || comp.administrative_area_level_2 ||
          null,
      countryCode: comp.country_code || this.defaultCountry,
      countryName: comp.country ||
          null,
      latitude: place.geometry?.location?.lat?.() ?? null,
      longitude: place.geometry?.location?.lng?.() ??
          null,
      matchScore: 0.9,
      matchLevel: "PLACES",
      providerSource: "GOOGLE_PLACES",
    };
  }

  fromTes(item) {
    if (!item) return null;
    return {
      fullAddressLabel: item.label || null,
      street: item.street ||
          null,
      houseNumber: item.houseNumber || null,
      postalCode: item.postalCode ||
          null,
      city: item.city || null,
      countryCode: item.countryCode ||
          this.defaultCountry,
      countryName: item.country || null,
      latitude: typeof item.latitude === "number" ?
          item.latitude : null,
      longitude: typeof item.longitude === "number" ?
          item.longitude : null,
      matchScore: typeof item.score === "number" ?
          item.score : 0.7,
      matchLevel: item.level ||
          "TES",
      providerSource: "TES",
    };
  }

  normalizeBatch(list, origin) {
    if (!Array.isArray(list)) return [];
    if (origin === "GEOCODER") return list.map(x => this.fromGoogleGeocoder(x)).filter(Boolean);
    if (origin === "PLACES") return list.map(x => this.fromGooglePlaces(x)).filter(Boolean);
    if (origin === "TES") return list.map(x => this.fromTes(x)).filter(Boolean);
    return [];
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