/**
 * ARCHITECTURE: EnvironmentConfigService centralizes runtime configuration discovery for the frontend.
 * It follows the manifesto by isolating environment concerns and producing a deterministic config object.
 * Responsibilities:
 * - Load API base URL and flags from environment variables or window-injected globals.
 * - Expose get(key) and typed helpers; set window.__API_BASE_URL__ for ApiHttpClient consumers.
 */
export class EnvironmentConfigService {
  constructor() {
    this._loaded = false;
    this._cfg = {
      API_BASE_URL: "",
      GOOGLE_MAPS_API_KEY: "",
      APP_ENV: "development",
    };
  }

  async load() {
    if (this._loaded) return this._cfg;
    const w = typeof window !== "undefined" ? window : {};
    const env = w.__APP_ENV__ || {};
    const apiFromWindow = (w.__API_BASE_URL__ || "").trim();
    const apiFromEnv = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";
    const keyFromWindow = (w.__GOOGLE_MAPS_API_KEY__ || "").trim();
    const keyFromEnv = (import.meta && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || "";
    const appEnv = (import.meta && import.meta.env && import.meta.env.MODE) || env.MODE || "development";
    this._cfg = {
      API_BASE_URL: apiFromWindow || apiFromEnv || "",
      GOOGLE_MAPS_API_KEY: keyFromWindow || keyFromEnv || "",
      APP_ENV: appEnv,
    };
    if (typeof window !== "undefined") {
      window.__API_BASE_URL__ = this._cfg.API_BASE_URL;
    }
    this._loaded = true;
    return this._cfg;
  }

  get(key, fallback = null) {
    return Object.prototype.hasOwnProperty.call(this._cfg, key) ? this._cfg[key] : fallback;
  }

  apiBase() {
    return this.get("API_BASE_URL", "");
  }

  googleKey() {
    return this.get("GOOGLE_MAPS_API_KEY", "");
  }

  appEnv() {
    return this.get("APP_ENV", "development");
  }
}
