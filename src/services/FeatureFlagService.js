/**
 * ARCHITECTURE: FeatureFlagService loads and caches runtime feature flags that guide UX policies.
 * It follows the manifesto by centralizing flag access behind explicit getters with session caching.
 * Responsibilities:
 * - Fetch flags from backend once; expose booleans for critical flows (requireGeocode, bulkEdit).
 * - Allow local overrides for testing without changing backend state.
 */
import apiClient from "@/services/api";

export class FeatureFlagService {
  constructor(endpoint = "/status/feature-flags") {
    this.endpoint = endpoint;
    this._flags = null;
    this._inFlight = null;
    this._overrides = {};
  }

  async load() {
    if (this._flags) return this._flags;
    if (this._inFlight) return this._inFlight;
    this._inFlight = apiClient.get(this.endpoint).then(r => {
      this._flags = r?.data || {};
      return this._flags;
    }).finally(() => (this._inFlight = null));
    return this._inFlight;
  }

  setOverride(key, value) {
    this._overrides[key] = value;
    return true;
  }

  get(key, fallback = false) {
    const base = this._flags && Object.prototype.hasOwnProperty.call(this._flags, key) ? this._flags[key] : fallback;
    return Object.prototype.hasOwnProperty.call(this._overrides, key) ? this._overrides[key] : base;
  }

  requireGeocode() {
    return !!this.get("REQUIRE_GEOCODE", false);
  }

  allowBulkEdit() {
    return !!this.get("ALLOW_BULK_EDIT", true);
  }
}
