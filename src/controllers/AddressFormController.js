/**
 * ARCHITECTURE: AddressFormController coordinates field masking, editability rules, guard checks, and realtime verification.
 * It follows the manifesto by isolating input lifecycle from components and wiring existing services behind one API.
 * Responsibilities:
 * - Apply masks on change, consult AddressFieldGuard for editability, and gate verification with VerificationGuardController.
 * - Invoke RealtimeVerificationOrchestrator and MapViewportPolicyController to produce instant geocode + ranked hints.
 * - Expose a stable snapshot with input, validation, instant, suggestions, and busy flags for the view.
 *
 * REFACTORED: Constructor aligned with RealtimeVerificationOrchestrator dependencies.
 * This class requires (geoRuntime, geocodeWithCacheController, mapController) to be injected.
 */
import { AddressInputMaskService } from "@/services/AddressInputMaskService";
import { AddressFieldGuard } from "@/services/AddressFieldGuard";
import { VerificationGuardController } from "@/controllers/VerificationGuardController";
import { RealtimeVerificationOrchestrator } from "@/controllers/RealtimeVerificationOrchestrator";
import { MapViewportPolicyController } from "@/controllers/MapViewportPolicyController";
import { ValidationService } from "@/services/ValidationService";
import { AddressNormalizer } from "@/services/AddressNormalizer";

export class AddressFormController {
  constructor(
      geoRuntime, // *** Injected GeoRuntime ***
      geocodeWithCacheController, // Geocode controller (uses Nominatim/Google adapter)
      mapController // Map controller (uses Leaflet/Google adapter)
  ) {
    if (!geoRuntime || !geocodeWithCacheController || !mapController) {
      const missing = [!geoRuntime && "geoRuntime", !geocodeWithCacheController && "geocodeWithCacheController", !mapController && "mapController"].filter(Boolean).join(', ');
      log.error(`[AddressFormController] CRITICAL: Missing required dependencies in constructor: ${missing}.`);
      // This controller is often instantiated by a view; throwing might be too harsh.
    }

    this.mask = new AddressInputMaskService("PL");
    this.guard = new AddressFieldGuard();
    this.verifyGuard = new VerificationGuardController();

    // *** FIX: Instantiate orchestrator with correct (geoRuntime, geocodeController, debounce) ***
    this.realtime = new RealtimeVerificationOrchestrator(
        geoRuntime,
        geocodeWithCacheController,
        300 // Debounce time
    );
    this.viewport = new MapViewportPolicyController(mapController);
    this.validator = new ValidationService("PL");
    this.normalizer = new AddressNormalizer();
    this.input = { street: "", houseNumber: "", postalCode: "", city: "", country: "PL" };
    this.validation = { valid: false, errors: {} };
    this.instant = null;
    this.suggestions = [];
    this.loading = false;
    this.error = null;
  }

  setField(field, value) {
    if (!this.guard.canEdit(field, { country: this.input.country })) return this.snapshot();

    // Apply masks (implementation is currently stubbed)
    if (field === "postalCode") this.input.postalCode = this.mask.maskPostal(value, this.input.country);
    else if (field === "street") this.input.street = this.mask.maskStreet(value);
    else if (field === "city") this.input.city = this.mask.maskCity(value);
    else if (field === "houseNumber") this.input.houseNumber = this.mask.maskHouseNo(value);
    else if (field === "country") this.input.country = String(value || "PL").toUpperCase();
    else this.input[field] = value; // Handle other fields directly

    // Trigger verification after field update (will be debounced by orchestrator)
    this.verifyIfReady(); // No await needed, runs async

    return this.snapshot(); // Return current state immediately
  }

  async verifyIfReady() {
    // Check if enough fields are present to trigger verification
    const gate = this.verifyGuard.shouldVerify(this.input);
    const currentNormalized = this.normalizer.normalize(this.input); // Normalize for validation
    this.validation = this.validator.validate(currentNormalized); // Update validation state regardless

    if (!gate.allow) {
      log.debug("[AddressForm] Verification skipped:", gate.reason, gate.missing);
      this.loading = false;
      this.error = null;
      this.instant = null; // Clear previous results if input becomes invalid
      this.suggestions = [];
      return this.snapshot(); // Return updated validation state
    }

    // Input is sufficient, trigger debounced verification
    this.loading = true;
    this.error = null;
    try {
      const res = await this.realtime.verify(this.input); // Await the debounced result
      this.instant = res.instant || null;
      this.suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];

      // Focus map on the instant result if available
      if (this.instant && this.instant.latitude != null && this.instant.longitude != null && this.viewport) {
        await this.viewport.focusInstant({ ...this.instant, matchLevel: "GEOCODER" });
      }
    } catch (err) {
      log.error("[AddressForm] Realtime verification failed:", err);
      this.error = "Verification failed.";
      this.instant = null;
      this.suggestions = [];
    } finally {
      this.loading = false;
    }

    return this.snapshot();
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
}

// Basic logger shim
const log = {
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
