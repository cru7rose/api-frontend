// FILE: src/adapters/GoogleMapsScriptLoader.js
// KEPT AS IS (from previous restore) - needed for optional Google usage
/**
 * ARCHITECTURE: GoogleMapsScriptLoader ensures exactly-once loading of the Google Maps JS API.
 * Uses a static promise to prevent multiple script injections across the application.
 */
export class GoogleMapsScriptLoader {
  static _promise = null;
  static _loadedKey = null;
  static _loadedLibsKey = null;

  load(apiKey, libraries = []) {
    // ... (implementation kept from previous restore) ...
    if (!apiKey || typeof apiKey !== "string") { return Promise.reject(new Error("GoogleMapsScriptLoader: missing apiKey.")); }
    const libs = Array.isArray(libraries) ? libraries.slice().sort() : [];
    const libsKey = libs.join(",");
    if (GoogleMapsScriptLoader._promise && GoogleMapsScriptLoader._loadedKey === apiKey && GoogleMapsScriptLoader._loadedLibsKey === libsKey) { return GoogleMapsScriptLoader._promise; }
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      if (GoogleMapsScriptLoader._promise && (GoogleMapsScriptLoader._loadedKey !== apiKey || GoogleMapsScriptLoader._loadedLibsKey !== libsKey)) { console.warn("GoogleMapsScriptLoader: Google Maps already loaded, potentially with different settings."); }
      GoogleMapsScriptLoader._promise = Promise.resolve(window.google);
      GoogleMapsScriptLoader._loadedKey = apiKey; GoogleMapsScriptLoader._loadedLibsKey = libsKey;
      return GoogleMapsScriptLoader._promise;
    }
    const src = new URL("https://maps.googleapis.com/maps/api/js");
    src.searchParams.set("key", apiKey);
    if (libs.length) src.searchParams.set("libraries", libsKey);
    src.searchParams.set("v", "weekly"); src.searchParams.set("loading", "async");
    const callbackName = `__googleMapsApiOnLoadCallback_${Date.now()}`;
    GoogleMapsScriptLoader._promise = new Promise((resolve, reject) => {
      window[callbackName] = () => {
        if (window.google && window.google.maps) {
          console.log("Google Maps API script loaded successfully via callback.");
          GoogleMapsScriptLoader._loadedKey = apiKey; GoogleMapsScriptLoader._loadedLibsKey = libsKey;
          resolve(window.google);
        } else {
          console.error("Google Maps callback executed, but window.google.maps is still undefined.");
          reject(new Error("Google Maps script loaded but window.google.maps is undefined."));
        }
        delete window[callbackName];
      };
      const scriptElement = document.createElement("script");
      scriptElement.src = `${src.toString()}&callback=${callbackName}`;
      scriptElement.async = true; scriptElement.defer = true;
      scriptElement.onerror = (err) => {
        console.error("Google Maps script failed to load.", err);
        GoogleMapsScriptLoader._promise = null; GoogleMapsScriptLoader._loadedKey = null; GoogleMapsScriptLoader._loadedLibsKey = null;
        reject(new Error("Google Maps script failed to load. Check API Key, network, and browser console."));
        delete window[callbackName];
      };
      document.head.appendChild(scriptElement);
    });
    GoogleMapsScriptLoader._loadedKey = apiKey; GoogleMapsScriptLoader._loadedLibsKey = libsKey;
    return GoogleMapsScriptLoader._promise;
  }
}