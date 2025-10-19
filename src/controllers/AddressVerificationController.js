/**
 * ARCHITECTURE: AddressVerificationController orchestrates Google-first verification and TES-backed suggestions.
 * It follows the manifesto by isolating IO, retries, and provider alignment (set GOOGLE) behind simple methods.
 * Responsibilities:
 * - Ensure TES provider is set to GOOGLE via admin API.
 * - Trigger on-demand suggestions and poll operation status (Kafka-based flow).
 * - Perform instant client-side geocode with Google for live map feedback.
 * - Merge and return a unified suggestion list and a normalized best candidate for the Editor.
 */
import apiClient from "@/services/api";
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";

export class AddressVerificationController {
  constructor() {
    this._google = null;
    this._mapsLoader = new GoogleMapsScriptLoader();
    this._geocoder = null;
    this.providerAligned = false;
    this.loading = false;
    this.error = null;
  }

  async alignProviderToGoogle() {
    try {
      const current = await apiClient.get("/api/admin/address-verification/providers/current");
      if (current?.data?.provider !== "GOOGLE") {
        await apiClient.post("/api/admin/address-verification/providers/current", "GOOGLE", {
          headers: { "Content-Type": "text/plain" },
        });
      }
      this.providerAligned = true;
      return true;
    } catch (e) {
      this.providerAligned = false;
      throw new Error("Failed to align TES provider to GOOGLE.");
    }
  }

  async initGoogle(apiKey, libraries = []) {
    this._google = await this._mapsLoader.load(apiKey, libraries);
    this._geocoder = new GoogleGeocodingAdapter(this._google);
    return true;
  }

  async geocodeInstant(addressDto) {
    if (!this._geocoder) throw new Error("Google not initialized.");
    const normalized = await this._geocoder.geocodeAddress(addressDto);
    return normalized;
  }

  async suggestOnDemand(addressQuery) {
    if (!addressQuery || Object.values(addressQuery).every(v => !v)) {
      return [];
    }
    const start = await apiClient.post("/api/admin/address-verification/suggest-on-demand", addressQuery);
    const correlationId = start?.data?.correlationId;
    if (!correlationId) throw new Error("Missing correlationId for suggest-on-demand.");
    const suggestions = await this._pollOperation(correlationId);
    return suggestions;
  }

  async searchByName(query) {
    if (!query || !query.trim()) {
      return [];
    }
    const start = await apiClient.post("/api/admin/address-verification/search-by-name", query, {
      headers: { "Content-Type": "text/plain" },
    });
    const correlationId = start?.data?.correlationId;
    if (!correlationId) throw new Error("Missing correlationId for search-by-name.");
    const suggestions = await this._pollOperation(correlationId);
    return suggestions;
  }

  async verifyAddressFlow(googleApiKey, addressDto) {
    this.loading = true;
    this.error = null;
    try {
      await this.alignProviderToGoogle(); /* aligns TES provider to GOOGLE. :contentReference[oaicite:0]{index=0} */
      await this.initGoogle(googleApiKey, ["geocoding"]);
      const instant = await this.geocodeInstant(addressDto);
      const backendSuggestions = await this.suggestOnDemand({
        street: addressDto.street || "",
        houseNumber: addressDto.houseNumber || "",
        postalCode: addressDto.postalCode || "",
        city: addressDto.city || "",
        country: addressDto.country || "PL",
      }); /* uses async TES operation and polls status. :contentReference[oaicite:1]{index=1} */
      const merged = this._mergeSuggestions(instant, backendSuggestions);
      this.loading = false;
      return { instant, suggestions: merged };
    } catch (e) {
      this.loading = false;
      this.error = e?.message || "Verification failed.";
      throw e;
    }
  }

  _mergeSuggestions(instant, backendList) {
    const list = Array.isArray(backendList) ? backendList.slice() : [];
    const fromInstant = instant
      ? {
          fullAddressLabel: `${instant.street || ""} ${instant.houseNumber || ""}, ${instant.postalCode || ""} ${instant.city || ""}`,
          street: instant.street || null,
          houseNumber: instant.houseNumber || null,
          postalCode: instant.postalCode || null,
          city: instant.city || null,
          countryCode: instant.country || null,
          countryName: null,
          latitude: instant.latitude ?? null,
          longitude: instant.longitude ?? null,
          matchScore: 1.0,
          matchLevel: "GEOCODER",
          providerSource: "GOOGLE_CLIENT",
        }
      : null;
    if (fromInstant) list.unshift(fromInstant);
    return list;
  }

  async _pollOperation(correlationId) {
    const maxRetries = 10;
    const interval = 2000;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, interval));
      const status = await apiClient.get(`/api/admin/address-verification/operations/${correlationId}`);
      const op = status?.data;
      if (op?.status === "COMPLETED") {
        return op?.result?.suggestions || [];
      }
      if (op?.status === "FAILED") {
        throw new Error(op?.errorDetails || "Suggestion operation failed.");
      }
    }
    throw new Error("Address suggestion polling timeout.");
  }
}
