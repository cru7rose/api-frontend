/**
 * ARCHITECTURE: Coordinates address form field interactions and triggers realtime verification.
 * REFACTORED: Constructor aligned with RealtimeVerificationOrchestrator dependencies.
 * This class requires (geoRuntime, geocodeWithCacheController, mapController) to be injected.
 * NOTE: This file appears to be a duplicate of AddressFormController.js and exports
 * the same class name. Both files have been corrected to the same implementation.
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
            log.error(`[AddressFormController-Verification] CRITICAL: Missing required dependencies in constructor: ${missing}.`);
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

        if (field === "postalCode") this.input.postalCode = this.mask.maskPostal(value, this.input.country);
        else if (field === "street") this.input.street = this.mask.maskStreet(value);
        else if (field === "city") this.input.city = this.mask.maskCity(value);
        else if (field === "houseNumber") this.input.houseNumber = this.mask.maskHouseNo(value);
        else if (field === "country") this.input.country = String(value || "PL").toUpperCase();
        else this.input[field] = value;

        this.verifyIfReady(); // No await needed, runs async
        return this.snapshot(); // Return current state immediately
    }

    async verifyIfReady() {
        const gate = this.verifyGuard.shouldVerify(this.input);
        const currentNormalized = this.normalizer.normalize(this.input);
        this.validation = this.validator.validate(currentNormalized);

        if (!gate.allow) {
            log.debug("[AddressForm-Verification] Verification skipped:", gate.reason, gate.missing);
            this.loading = false;
            this.error = null;
            this.instant = null;
            this.suggestions = [];
            return this.snapshot();
        }

        this.loading = true;
        this.error = null;
        try {
            const res = await this.realtime.verify(this.input);
            this.instant = res.instant || null;
            this.suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];

            if (this.instant && this.instant.latitude != null && this.instant.longitude != null && this.viewport) {
                await this.viewport.focusInstant({ ...this.instant, matchLevel: "GEOCODER" });
            }
        } catch (err) {
            log.error("[AddressForm-Verification] Realtime verification failed:", err);
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
