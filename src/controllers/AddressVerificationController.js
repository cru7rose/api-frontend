/**
 * ARCHITECTURE: AddressVerificationController orchestrates Google-first verification and TES-backed suggestions.
 * It follows the manifesto by isolating IO, retries, and provider alignment (set GOOGLE) behind simple methods.
 * Responsibilities:
 * - Ensure TES provider is set to GOOGLE via admin API proxy (asynchronously).
 * - Trigger on-demand suggestions and search-by-name via DANXILS-API proxy (Kafka-based flow) and poll operation status.
 * - Perform instant client-side geocode with Google for live map feedback.
 * - Merge and return a unified suggestion list and a normalized best candidate for the Editor.
 */
import apiClient from "@/services/api";
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { TesOperationPoller } from "@/services/TesOperationPoller";
import { ProviderGuard } from "@/controllers/ProviderGuard";

export class AddressVerificationController {
    constructor(poller = new TesOperationPoller(), providerGuard = new ProviderGuard(poller)) {
        this._google = null;
        this._mapsLoader = new GoogleMapsScriptLoader();
        this._geocoder = null;
        this._poller = poller;
        this._providerGuard = providerGuard;
        this.loading = false;
        this.error = null;
    }

    /** @deprecated Provider alignment is now handled asynchronously by ProviderGuard.ensureGoogle(). */
    async alignProviderToGoogle() {
        console.warn("AddressVerificationController.alignProviderToGoogle is deprecated. Use ProviderGuard.ensureGoogle().");
        try {
            await this._providerGuard.ensureGoogle();
            return true;
        } catch (e) {
            this.error = e.message;
            return false;
        }
    }

    async initGoogle(apiKey, libraries = ["geocoding"]) {
        if (this._google) return true;
        try {
            this._google = await this._mapsLoader.load(apiKey, libraries);
            this._geocoder = new GoogleGeocodingAdapter(this._google);
            return true;
        } catch (e) {
            this.error = `Failed to initialize Google Maps: ${e.message}`;
            console.error(this.error, e);
            throw e;
        }
    }

    async geocodeInstant(addressDto) {
        if (!this._geocoder) throw new Error("Google geocoder not initialized.");
        try {
            return await this._geocoder.geocodeAddress(addressDto);
        } catch (e) {
            console.error("Instant geocoding failed:", e);
            return null;
        }
    }

    async suggestOnDemand(addressQuery) {
        if (!addressQuery || Object.values(addressQuery).every(v => !v)) return [];
        this.loading = true;
        this.error = null;
        try {
            const startResponse = await apiClient.post("/api/admin/address-verification/suggest-on-demand", addressQuery);
            const correlationId = startResponse?.data?.correlationId;
            if (!correlationId) throw new Error("Missing correlationId from suggest-on-demand initiation.");

            const operationResult = await this._poller.waitFor(correlationId);

            if (operationResult.status === "COMPLETED") {
                const resultPayload = operationResult.result || {};
                return resultPayload.suggestions || [];
            } else {
                throw new Error(operationResult.errorDetails || "Suggestion operation failed.");
            }
        } catch (e) {
            console.error("Suggest-on-demand flow failed:", e);
            this.error = e.message;
            return [];
        } finally {
            this.loading = false;
        }
    }

    async searchByName(query) {
        if (!query || !query.trim()) return [];
        this.loading = true;
        this.error = null;
        try {
            const startResponse = await apiClient.post("/api/admin/address-verification/search-by-name", query.trim(), {
                headers: { "Content-Type": "text/plain" },
            });
            const correlationId = startResponse?.data?.correlationId;
            if (!correlationId) throw new Error("Missing correlationId from search-by-name initiation.");

            const operationResult = await this._poller.waitFor(correlationId);

            if (operationResult.status === "COMPLETED") {
                const resultPayload = operationResult.result || {};
                return resultPayload.suggestions || [];
            } else {
                throw new Error(operationResult.errorDetails || "Search-by-name operation failed.");
            }
        } catch (e) {
            console.error("Search-by-name flow failed:", e);
            this.error = e.message;
            return [];
        } finally {
            this.loading = false;
        }
    }

    async verifyAddressFlow(googleApiKey, addressDto) {
        this.loading = true;
        this.error = null;
        try {
            await this._providerGuard.ensureGoogle();
            await this.initGoogle(googleApiKey, ["geocoding", "places"]);
            const instantResult = await this.geocodeInstant(addressDto);
            const backendSuggestions = await this.suggestOnDemand({
                street: addressDto.street || "",
                houseNumber: addressDto.houseNumber || "",
                postalCode: addressDto.postalCode || "",
                city: addressDto.city || "",
                country: addressDto.country || "PL",
            });
            const mergedSuggestions = this._mergeSuggestions(instantResult, backendSuggestions);
            return { instant: instantResult, suggestions: mergedSuggestions };
        } catch (e) {
            this.error = e?.message || "Verification flow failed.";
            console.error("verifyAddressFlow failed:", e);
            throw e;
        } finally {
            this.loading = false;
        }
    }

    _mergeSuggestions(instant, backendList) {
        const list = Array.isArray(backendList) ? [...backendList] : [];
        const fromInstant = instant ? {
            fullAddressLabel: `${instant.street || ""} ${instant.houseNumber || ""}, ${instant.postalCode || ""} ${instant.city || ""}`.replace(/ ,|,$/,'').trim(),
            street: instant.street || null,
            houseNumber: instant.houseNumber || null,
            postalCode: instant.postalCode || null,
            city: instant.city || null,
            countryCode: instant.country || null,
            latitude: instant.latitude ?? null,
            longitude: instant.longitude ?? null,
            matchScore: 1.0,
            matchLevel: "GEOCODER",
            providerSource: "GOOGLE_CLIENT",
        } : null;

        if (fromInstant) {
            list.unshift(fromInstant);
        }
        return list;
    }
}
