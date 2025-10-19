/**
 * ARCHITECTURE: AddressFormController coordinates field masking, editability rules, guard checks, and realtime verification.
 * It follows the manifesto by isolating input lifecycle from components and wiring existing services behind one API.
 * Responsibilities:
 * - Apply masks on change, consult AddressFieldGuard for editability, and gate verification with VerificationGuardController.
 * - Invoke RealtimeVerificationOrchestrator and MapViewportPolicyController to produce instant geocode + ranked hints.
 * - Expose a stable snapshot with input, validation, instant, suggestions, and busy flags for the view.
 */
import { AddressInputMaskService } from "@/services/AddressInputMaskService";
import { AddressFieldGuard } from "@/services/AddressFieldGuard";
import { VerificationGuardController } from "@/controllers/VerificationGuardController";
import { RealtimeVerificationOrchestrator } from "@/controllers/RealtimeVerificationOrchestrator";
import { MapViewportPolicyController } from "@/controllers/MapViewportPolicyController";
import { ValidationService } from "@/services/ValidationService";
import { AddressNormalizer } from "@/services/AddressNormalizer";

export class AddressFormController {
  constructor(geocodeWithCacheController, placesAdapter, mapController) {
    this.mask = new AddressInputMaskService("PL");
    this.guard = new AddressFieldGuard();
    this.verifyGuard = new VerificationGuardController();
    this.realtime = new RealtimeVerificationOrchestrator(geocodeWithCacheController, placesAdapter, 300);
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
    if (field === "postalCode") this.input.postalCode = this.mask.maskPostal(value, this.input.country);
    else if (field === "street") this.input.street = this.mask.maskStreet(value);
    else if (field === "city") this.input.city = this.mask.maskCity(value);
    else if (field === "houseNumber") this.input.houseNumber = this.mask.maskHouseNo(value);
    else if (field === "country") this.input.country = String(value || "PL").toUpperCase();
    else this.input[field] = value;
    return this.snapshot();
  }

  async verifyIfReady() {
    const gate = this.verifyGuard.shouldVerify(this.input);
    if (!gate.allow) {
      this.loading = false;
      this.error = null;
      this.instant = null;
      this.suggestions = [];
      this.validation = this.validator.validate(this.normalizer.normalize(this.input));
      return this.snapshot();
    }
    this.loading = true;
    this.error = null;
    const res = await this.realtime.verify(this.input);
    this.loading = false;
    this.instant = res.instant || null;
    this.suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];
    if (this.instant) await this.viewport.focusInstant({ ...this.instant, matchLevel: "GEOCODER" });
    this.validation = this.validator.validate(this.normalizer.normalize(this.input));
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
