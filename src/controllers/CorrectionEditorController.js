/**
 * ARCHITECTURE: CorrectionEditorController orchestrates the "side-by-side diff" editor.
 * It follows the manifesto by isolating all IO and decision logic away from the component tree.
 * Responsibilities:
 * - Loads OrderDetail and related suggestions for pickup/delivery.
 * - Maintains editable copies of addresses, integrates optional geocoder.
 * - Applies Accept Suggestion, Use Original, Manual Edit, Save, and Save & Next.
 * - Shields UI from API details via AddressExceptionApi and from map choice via GeocodeWithCacheController.
 * REFACTORED: Now accepts a GeocodeWithCacheController instead of MapGeocoderAdapter.
 */
import { Address } from "@/domain/WorkbenchModels";
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
// *** MODIFIED: Import GeocodeWithCacheController ***
import { GeocodeWithCacheController } from "@/controllers/GeocodeWithCacheController";
// *** REMOVED: MapGeocoderAdapter import

export class CorrectionEditorController {
  constructor(api = new AddressExceptionApi(), geocoder = null) {
    this.api = api;
    // *** FIX: Check for GeocodeWithCacheController instance ***
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
    // *** FIX: Update type check ***
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
    this.editedPickup = new Address(
        this.detail.originalPickup.street,
        this.detail.originalPickup.houseNumber,
        this.detail.originalPickup.postalCode,
        this.detail.originalPickup.city,
        this.detail.originalPickup.country,
        this.detail.originalPickup.latitude,
        this.detail.originalPickup.longitude
    );
    this.editedDelivery = new Address(
        this.detail.originalDelivery.street,
        this.detail.originalDelivery.houseNumber,
        this.detail.originalDelivery.postalCode,
        this.detail.originalDelivery.city,
        this.detail.originalDelivery.country,
        this.detail.originalDelivery.latitude,
        this.detail.originalDelivery.longitude
    );
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
    const addr = new Address(
        s.street || "",
        s.houseNumber || null,
        s.postalCode || "",
        s.city || "",
        s.countryCode || this._defaultCountry(),
        s.latitude ?? null,
        s.longitude ?? null
    );
    if (side === "pickup") this.editedPickup = addr;
    if (side === "delivery") this.editedDelivery = addr;
    return Result.ok(addr);
  }

  useOriginal(side) {
    if (!this.detail) return Result.fail(new Error("Order not loaded."));
    if (side === "pickup") {
      const o = this.detail.originalPickup;
      this.editedPickup = new Address(o.street, o.houseNumber, o.postalCode, o.city, o.country, o.latitude, o.longitude);
      return Result.ok(this.editedPickup);
    }
    if (side === "delivery") {
      const o = this.detail.originalDelivery;
      this.editedDelivery = new Address(o.street, o.houseNumber, o.postalCode, o.city, o.country, o.latitude, o.longitude);
      return Result.ok(this.editedDelivery);
    }
    return Result.fail(new Error("Unknown side."));
  }

  setManualAddress(side, address) {
    if (!(address instanceof Address)) return Result.fail(new Error("Invalid Address."));
    if (side === "pickup") this.editedPickup = address;
    else if (side === "delivery") this.editedDelivery = address;
    else return Result.fail(new Error("Unknown side."));
    return Result.ok(address);
  }

  async geocodeEdited(side) {
    // *** FIX: Use GeocodeWithCacheController ***
    if (!this.geocoder) return Result.fail(new Error("No geocoder available."));
    const addr = side === "pickup" ? this.editedPickup : this.editedDelivery;
    if (!(addr instanceof Address)) return Result.fail(new Error("No edited address."));

    // Call the geocode method on GeocodeWithCacheController
    const r = await this.geocoder.geocode({
      street: addr.street,
      houseNumber: addr.houseNumber,
      postalCode: addr.postalCode,
      city: addr.city,
      country: addr.country,
    });

    if (!r) return Result.fail(new Error("Geocode not found."));

    // GeocodeWithCacheController returns the full normalized address object
    addr.latitude = r.latitude;
    addr.longitude = r.longitude;
    // Optionally update other fields if normalization is desired
    // addr.street = r.street;
    // addr.houseNumber = r.houseNumber;
    // addr.postalCode = r.postalCode;
    // addr.city = r.city;

    return Result.ok({ lat: r.latitude, lon: r.longitude });
  }

  async saveAcceptSuggestion(side) {
    if (!this.orderId) return Result.fail(new Error("Order not loaded."));
    const payload = {
      orderId: this.orderId,
      side: side === "both" ? "both" : side === "pickup" ? "pickup" : "delivery",
      correctedPickup: side === "pickup" || side === "both" ? this.editedPickup : null,
      correctedDelivery: side === "delivery" || side === "both" ? this.editedDelivery : null,
      resolution: "ACCEPT_SUGGESTION",
    };
    const res = await this.api.saveCorrection(payload);
    if (!res.ok) return Result.fail(res.error);
    return Result.ok(res.value);
  }

  async saveUseOriginal(side) {
    if (!this.orderId) return Result.fail(new Error("Order not loaded."));
    const payload = {
      orderId: this.orderId,
      side: side === "both" ? "both" : side === "pickup" ? "pickup" : "delivery",
      correctedPickup: side === "pickup" || side === "both" ? this.editedPickup : null,
      correctedDelivery: side === "delivery" || side === "both" ? this.editedDelivery : null,
      resolution: "USE_ORIGINAL",
    };
    const res = await this.api.saveCorrection(payload);
    if (!res.ok) return Result.fail(res.error);
    return Result.ok(res.value);
  }

  async saveManual(side) {
    if (!this.orderId) return Result.fail(new Error("Order not loaded."));
    const payload = {
      orderId: this.orderId,
      side: side === "both" ? "both" : side === "pickup" ? "pickup" : "delivery",
      correctedPickup: side === "pickup" || side === "both" ? this.editedPickup : null,
      correctedDelivery: side === "delivery" || side === "both" ? this.editedDelivery : null,
      resolution: "MANUAL_EDIT",
    };
    const res = await this.api.saveCorrection(payload);
    if (!res.ok) return Result.fail(res.error);
    return Result.ok(res.value);
  }

  async saveAndNext(side, worklistStore) {
    const saveRes = await this._saveBySideKind(side);
    if (!saveRes.ok) return saveRes;
    const nextIdRes = await worklistStore.getNextAndLoad(this.orderId);
    if (!nextIdRes.ok) return Result.fail(nextIdRes.error);
    const nextId = nextIdRes.value;
    if (!nextId) return Result.ok(null);
    const loadRes = await this.loadOrder(nextId);
    if (!loadRes.ok) return Result.fail(loadRes.error);
    return Result.ok(nextId);
  }

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
    if (side === "pickup") return this.saveManual("pickup");
    if (side === "delivery") return this.saveManual("delivery");
    if (side === "both") return this.saveManual("both");
    return Result.fail(new Error("Unknown side."));
  }
}
