// FILE: src/controllers/EditorVerificationController.js
// UPDATED FILE (Remove Places dependency)
import { AddressNormalizer } from "@/services/AddressNormalizer";
import { ValidationService } from "@/services/ValidationService";
import { DebounceTimer } from "@/services/DebounceTimer";

/**
 * ARCHITECTURE: Coordinates live verification for the Correction Editor input fields.
 * REFACTORED: Removed Google Places adapter dependency. Relies on geocoder only.
 */
export class EditorVerificationController {
  constructor(
      geocoderAdapter, // e.g., NominatimGeocodingAdapter instance
      // Removed placesAdapter
      mapController,
      debounceMs = 400
  ) {
    this.normalizer = new AddressNormalizer();
    this.validator = new ValidationService(); // Assuming country PL default or configurable
    this.debouncer = new DebounceTimer(debounceMs);
    this.geocoder = geocoderAdapter || null;
    // this.places = null; // Removed
    this.map = mapController || null;
    this.input = { street: "", houseNumber: "", postalCode: "", city: "", country: "PL" };
    this.validation = { valid: false, errors: {} };
    this.instant = null; // Result from geocoder
    this.suggestions = []; // Now likely just [instant] or []
    this.loading = false;
    this.error = null;
  }

  setInputPatch(patch) {
    this.input = { ...this.input, ...(patch || {}) };
    return this.input;
  }

  async runVerification() {
    return this.debouncer.run(async () => {
      this.loading = true;
      this.error = null;
      this.instant = null; // Reset results
      this.suggestions = [];

      const normalized = this.normalizer.normalize(this.input);
      const check = this.validator.validate(normalized);
      this.validation = check;

      if (!check.valid) {
        log.debug("[EditorVerify] Input invalid, skipping geocode:", check.errors);
        this.loading = false;
        return this.snapshot();
      }

      let instantResult = null;
      if (this.geocoder) {
        try {
          instantResult = await this.geocoder.geocodeAddress(normalized);
          this.instant = instantResult; // Store the geocoded result
          if (instantResult) {
            this.suggestions = [this.mapGeoResultToSuggestion(instantResult, normalized)]; // Create suggestion from result
          }
        } catch (geoError) {
          log.error("[EditorVerify] Geocoder failed:", geoError);
          this.error = "Geocoding failed.";
          this.instant = null;
          this.suggestions = [];
        }
      } else {
        log.warn("[EditorVerify] No geocoder configured.");
      }

      // Update map marker if geocoding was successful and map exists
      if (instantResult && typeof instantResult.latitude === "number" && typeof instantResult.longitude === "number" && this.map) {
        try {
          await this.map.updateMarker(instantResult.latitude, instantResult.longitude, true); // Recenter map
        } catch (mapError) {
          log.error("[EditorVerify] Failed to update map marker:", mapError);
          // Non-critical error, continue
        }
      }

      this.loading = false;
      return this.snapshot();
    });
  }

  // Helper to map geocoder result to the suggestion format expected by downstream components
  mapGeoResultToSuggestion(geoResult, baseInput) {
    return {
      fullAddressLabel: geoResult._displayName || `${geoResult.street || ''} ${geoResult.houseNumber || ''}, ${geoResult.postalCode || ''} ${geoResult.city || ''}`.replace(/ ,|,$/,'').trim(),
      street: geoResult.street || null,
      houseNumber: geoResult.houseNumber || null,
      postalCode: geoResult.postalCode || null,
      city: geoResult.city || null,
      countryCode: geoResult.country || baseInput.country || "PL",
      countryName: null,
      latitude: geoResult.latitude ?? null,
      longitude: geoResult.longitude ?? null,
      matchScore: geoResult._confidence ?? 0.8,
      matchLevel: geoResult._osmType || "GEOCODER",
      providerSource: geoResult._provider || "GEOCODER_CLIENT",
    };
  }

  snapshot() {
    return {
      input: { ...this.input },
      validation: { ...this.validation },
      instant: this.instant ? { ...this.instant } : null,
      suggestions: this.suggestions.slice(),
      loading: this.loading,
      error: this.error,
    };
  }

  _composeFreeText(a) { // Keep for potential future use
    const line1 = a.houseNumber ? `${a.street || ''} ${a.houseNumber}` : a.street || "";
    return `${line1}, ${a.postalCode || ""} ${a.city || ""}`.trim();
  }
}

// Basic logger shim
const log = {
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};