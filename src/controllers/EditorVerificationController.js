/**
 * ARCHITECTURE: EditorVerificationController coordinates live verification for the Correction Editor input fields.
 * It follows the manifesto by composing debounce, normalization, validation, Google geocode, and Places hints.
 * Responsibilities:
 * - Debounce user input; on settle, normalize+validate; if valid, geocode and suggest via Places.
 * - Update a MapController through an injected adapter to visualize the current candidate.
 * - Provide a snapshot for the component to render without exposing third-party APIs.
 */
import { AddressNormalizer } from "@/services/AddressNormalizer";
import { ValidationService } from "@/services/ValidationService";
import { DebounceTimer } from "@/services/DebounceTimer";

export class EditorVerificationController {
  constructor(geocoderAdapter, placesAdapter, mapController, debounceMs = 400) {
    this.normalizer = new AddressNormalizer();
    this.validator = new ValidationService();
    this.debouncer = new DebounceTimer(debounceMs);
    this.geocoder = geocoderAdapter || null;
    this.places = placesAdapter || null;
    this.map = mapController || null;
    this.input = { street: "", houseNumber: "", postalCode: "", city: "", country: "PL" };
    this.validation = { valid: false, errors: {} };
    this.instant = null;
    this.suggestions = [];
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
      const normalized = this.normalizer.normalize(this.input);
      const check = this.validator.validate(normalized);
      this.validation = check;
      if (!check.valid) {
        this.instant = null;
        this.suggestions = [];
        this.loading = false;
        return this.snapshot();
      }
      const instant = this.geocoder ? await this.geocoder.geocodeAddress(normalized) : null;
      if (instant && typeof instant.latitude === "number" && typeof instant.longitude === "number" && this.map) {
        await this.map.updateMarker(instant.latitude, instant.longitude, true);
      }
      const hints = this.places ? await this.places.suggest(this._composeFreeText(normalized), normalized.country) : [];
      this.instant = instant;
      this.suggestions = Array.isArray(hints) ? hints : [];
      this.loading = false;
      return this.snapshot();
    });
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

  _composeFreeText(a) {
    const line1 = a.houseNumber ? `${a.street} ${a.houseNumber}` : a.street;
    return `${line1}, ${a.postalCode} ${a.city}`;
  }
}
