// ============================================================================
// Frontend: Update CorrectionEditorController
// FILE: src/controllers/CorrectionEditorController.js
// REASON: Populate 'name' and 'alias' fields in editedPickup/editedDelivery
//         state upon load, acceptSuggestion, and useOriginal.
// ============================================================================
/**
 * ARCHITECTURE: CorrectionEditorController orchestrates the "side-by-side diff" editor.
 * It follows the manifesto by isolating all IO and decision logic away from the component tree.
 * REFACTORED: Now accepts a GeocodeWithCacheController.
 * UPDATED: Now maps 'name' and 'alias' into the editable state.
 */
import { Address } from "@/domain/WorkbenchModels";
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { GeocodeWithCacheController } from "@/controllers/GeocodeWithCacheController";

export class CorrectionEditorController {
  constructor(api = new AddressExceptionApi(), geocoder = null) {
    this.api = api;
    this.geocoder = geocoder instanceof GeocodeWithCacheController ? geocoder : null;
    if (!this.geocoder) {
      console.warn("[CorrectionEditorController] Geocoder (GeocodeWithCacheController) was not provided or invalid.");
    }
    this.orderId = null;
    this.detail = null;
    this.loading = false;
    this.error = null;
    this.editedPickup = null;
    this.editedDelivery = null;
  }

  setGeocoderAdapter(adapter) {
    this.geocoder = adapter instanceof GeocodeWithCacheController ? adapter : null;
    return this.geocoder;
  }

  async loadOrder(orderId) {
    this.loading = true;
    this.error = null;
    this.orderId = orderId;
    this.detail = null;
    this.editedPickup = null;
    this.editedDelivery = null;
    const res = await this.api.getOrderDetail(orderId);
    if (!res.ok) {
      this.loading = false;
      this.error = res.error.message;
      return Result.fail(res.error);
    }
    this.detail = res.value;

    // --- UPDATED: Populate name/alias from original data ---
    this.editedPickup = new Address({
      street: this.detail.originalPickup.street,
      houseNumber: this.detail.originalPickup.houseNumber,
      postalCode: this.detail.originalPickup.postalCode,
      city: this.detail.originalPickup.city,
      country: this.detail.originalPickup.country,
      latitude: this.detail.originalPickup.latitude,
      longitude: this.detail.originalPickup.longitude,
      name: this.detail.originalPickup.name, // Added
      alias: this.detail.originalPickup.alias // Added
    });
    this.editedDelivery = new Address({
      street: this.detail.originalDelivery.street,
      houseNumber: this.detail.originalDelivery.houseNumber,
      postalCode: this.detail.originalDelivery.postalCode,
      city: this.detail.originalDelivery.city,
      country: this.detail.originalDelivery.country,
      latitude: this.detail.originalDelivery.latitude,
      longitude: this.detail.originalDelivery.longitude,
      name: this.detail.originalDelivery.name, // Added
      alias: this.detail.originalDelivery.alias // Added
    });
    // --- END UPDATE ---

    this.loading = false;
    return Result.ok(this.detail);
  }

  async refreshSuggestions(side) {
    if (!this.orderId) return Result.fail(new Error("Order not loaded."));
    const s = side === "pickup" ? "pickup" : "delivery";
    const res = await this.api.refreshSuggestions(this.orderId, s);
    if (!res.ok) return Result.fail(res.error);
    if (s === "pickup") this.detail.suggestedPickup = res.value;
    if (s === "delivery") this.detail.suggestedDelivery = res.value;
    return Result.ok(res.value);
  }

  acceptSuggestion(side, index = 0) {
    if (!this.detail) return Result.fail(new Error("Order not loaded."));
    const list = side === "pickup" ? this.detail.suggestedPickup : this.detail.suggestedDelivery;
    if (!Array.isArray(list) || !list[index]) return Result.fail(new Error("Suggestion not found."));
    const s = list[index];

    const base = side === "pickup" ? this.editedPickup : this.editedDelivery;
    const addr = new Address({
      street: s.street || "",
      houseNumber: s.houseNumber || null,
      postalCode: s.postalCode || "",
      city: s.city || "",
      country: s.countryCode || this._defaultCountry(),
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      name: base?.name || null, // Preserve existing edited name
      alias: base?.alias || null // Preserve existing edited alias
    });
    if (side === "pickup") this.editedPickup = addr;
    if (side === "delivery") this.editedDelivery = addr;
    return Result.ok(addr);
  }

  useOriginal(side) {
    if (!this.detail) return Result.fail(new Error("Order not loaded."));
    if (side === "pickup") {
      const o = this.detail.originalPickup;
      // --- UPDATED: Copy name/alias ---
      this.editedPickup = new Address({
        street: o.street, houseNumber: o.houseNumber, postalCode: o.postalCode, city: o.city, country: o.country,
        latitude: o.latitude, longitude: o.longitude,
        name: o.name, // Added
        alias: o.alias // Added
      });
      // --- END UPDATE ---
      return Result.ok(this.editedPickup);
    }
    if (side === "delivery") {
      const o = this.detail.originalDelivery;
      // --- UPDATED: Copy name/alias ---
      this.editedDelivery = new Address({
        street: o.street, houseNumber: o.houseNumber, postalCode: o.postalCode, city: o.city, country: o.country,
        latitude: o.latitude, longitude: o.longitude,
        name: o.name, // Added
        alias: o.alias // Added
      });
      // --- END UPDATE ---
      return Result.ok(this.editedDelivery);
    }
    return Result.fail(new Error("Unknown side."));
  }

  setManualAddress(side, address) {
    if (!(address instanceof Address)) return Result.fail(new Error("Invalid Address object."));
    if (side === "pickup") this.editedPickup = address;
    else if (side === "delivery") this.editedDelivery = address;
    else return Result.fail(new Error("Unknown side."));
    return Result.ok(address);
  }

  async geocodeEdited(side) {
    if (!this.geocoder) return Result.fail(new Error("No geocoder available."));
    const addr = side === "pickup" ? this.editedPickup : this.editedDelivery;
    if (!(addr instanceof Address)) return Result.fail(new Error("No edited address."));
    const r = await this.geocoder.geocode({
      street: addr.street,
      houseNumber: addr.houseNumber,
      postalCode: addr.postalCode,
      city: addr.city,
      country: addr.country,
    });
    if (!r) return Result.fail(new Error("Geocode not found."));

    addr.latitude = r.latitude;
    addr.longitude = r.longitude;

    return Result.ok({ lat: r.latitude, lon: r.longitude });
  }

  // --- DEPRECATED SAVE METHODS ---
  // Kept for facade compatibility
  async saveAcceptSuggestion(side) {
    log.warn("DEPRECATED: saveAcceptSuggestion called. Use SaveFlowController.");
    return Result.fail(new Error("Save logic is deprecated."));
  }
  async saveUseOriginal(side) {
    log.warn("DEPRECATED: saveUseOriginal called. Use SaveFlowController.");
    return Result.fail(new Error("Save logic is deprecated."));
  }
  async saveManual(side) {
    log.warn("DEPRECATED: saveManual called. Use SaveFlowController.");
    return Result.fail(new Error("Save logic is deprecated."));
  }
  async saveAndNext(side, worklistStore) {
    log.warn("DEPRECATED: saveAndNext called. Use SaveFlowController.");
    return Result.fail(new Error("Save logic is deprecated."));
  }
  // --- END DEPRECATED ---

  snapshot() {
    return {
      orderId: this.orderId,
      detail: this.detail,
      editedPickup: this.editedPickup,
      editedDelivery: this.editedDelivery,
      loading: this.loading,
      error: this.error,
    };
  }

  _defaultCountry() {
    return "PL";
  }

  async _saveBySideKind(side) {
    log.warn("DEPRECATED: _saveBySideKind called. Use SaveFlowController.");
    return Result.fail(new Error("Save logic is deprecated."));
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};