/**
 * ARCHITECTURE: GoogleKeyProvider offers a minimal, cached accessor for the Google Maps API key.
 * Responsibilities:
 * - Resolve the key from EnvironmentConfigService once and memoize it.
 */
import { EnvironmentConfigService } from "@/services/EnvironmentConfigService";

export class GoogleKeyProvider {
  constructor(configService = new EnvironmentConfigService()) {
    this.config = configService;
    this._key = null;
    this._inFlight = null;
  }

  async getKey() {
    if (this._key) return this._key;
    if (this._inFlight) return this._inFlight;
    this._inFlight = this.config.load().then(() => {
      this._key = this.config.googleKey();
      if (!this._key) throw new Error("GoogleKeyProvider: GOOGLE_MAPS_JS_API_KEY missing.");
      return this._key;
    }).finally(() => {
      this._inFlight = null;
    });
    return this._inFlight;
  }
}
