/**
 * ARCHITECTURE: AddressVerificationWorkflow runs normalize→validate→(optional)geocode to build a result model.
 * It follows the manifesto by keeping verification orchestration independent from UI and transport details.
 * Responsibilities:
 * - Normalize and validate input; if geocoder is injected, resolve coordinates as an "instant" candidate.
 * - Return {success, normalized, validation, instant, suggestions[]} without throwing on user errors.
 */
import { AddressNormalizer } from "@/services/AddressNormalizer";
import { ValidationService } from "@/services/ValidationService";

export class AddressVerificationWorkflow {
  constructor(googleApiKey = null, geocoderAdapter = null) {
    void googleApiKey;
    this.normalizer = new AddressNormalizer();
    this.validator = new ValidationService("PL");
    this.geocoder = geocoderAdapter || null;
  }

  async verify(address) {
    const normalized = this.normalizer.normalize(address);
    const validation = this.validator.validate(normalized);
    if (!validation.valid) {
      return {
        success: false,
        normalized,
        validation,
        instant: null,
        suggestions: [],
      };
    }
    let instant = null;
    if (this.geocoder && typeof this.geocoder.geocodeAddress === "function") {
      try {
        const r = await this.geocoder.geocodeAddress(normalized);
        if (r && typeof r.lat === "number" && typeof r.lon === "number") {
          instant = { latitude: r.lat, longitude: r.lon, providerSource: "GOOGLE_CLIENT", matchLevel: "GEOCODER", matchScore: 1.0 };
        }
      } catch (_) {
        instant = null;
      }
    }
    return {
      success: true,
      normalized,
      validation,
      instant,
      suggestions: [],
    };
  }
}
