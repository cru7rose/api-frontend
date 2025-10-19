/**
 * ARCHITECTURE: GoogleMapsScriptLoader ensures exactly-once loading of the Google Maps JS API.
 * It follows the manifesto by isolating third-party script lifecycle and exposing a minimal contract.
 * Responsibilities:
 * - Load the script with an API key and optional libraries only once per app session.
 * - Resolve when window.google is available; reject on network or auth errors.
 */
export class GoogleMapsScriptLoader {
  constructor() {
    this._promise = null;
    this._loadedKey = null;
    this._loadedLibsKey = null;
  }

  load(apiKey, libraries = []) {
    if (!apiKey || typeof apiKey !== "string") {
      return Promise.reject(new Error("GoogleMapsScriptLoader: missing apiKey."));
    }
    const libs = Array.isArray(libraries) ? libraries.slice().sort() : [];
    const libsKey = libs.join(",");
    if (this._promise && this._loadedKey === apiKey && this._loadedLibsKey === libsKey) {
      return this._promise;
    }
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      this._promise = Promise.resolve(window.google);
      this._loadedKey = apiKey;
      this._loadedLibsKey = libsKey;
      return this._promise;
    }
    const src = new URL("https://maps.googleapis.com/maps/api/js");
    src.searchParams.set("key", apiKey);
    if (libs.length) src.searchParams.set("libraries", libsKey);
    src.searchParams.set("v", "weekly");
    this._promise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src.toString();
      s.async = true;
      s.defer = true;
      s.onerror = () => reject(new Error("Google Maps script failed to load."));
      s.onload = () => {
        if (window.google && window.google.maps) {
          this._loadedKey = apiKey;
          this._loadedLibsKey = libsKey;
          resolve(window.google);
        } else {
          reject(new Error("Google Maps script loaded but window.google is undefined."));
        }
      };
      document.head.appendChild(s);
    });
    return this._promise;
  }
}
