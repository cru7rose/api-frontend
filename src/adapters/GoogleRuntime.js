/**
 * ARCHITECTURE: GoogleRuntime caches a single Google Maps JS instance and constructs common adapters on demand.
 * It follows the manifesto by preventing duplicate script loads and centralizing third-party object reuse.
 * Responsibilities:
 * - Load and memoize window.google, expose factories for Map, Geocoder, and Places adapters.
 * - Guard callers against uninitialized usage with explicit init().
 */
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleMapAdapter } from "@/adapters/GoogleMapAdapter";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { GooglePlacesAutocompleteAdapter } from "@/adapters/GooglePlacesAutocompleteAdapter";

export class GoogleRuntime {
  constructor() {
    this._loader = new GoogleMapsScriptLoader();
    this._google = null;
  }

  async init(apiKey, libraries = ["places"]) {
    if (this._google) return this._google;
    this._google = await this._loader.load(apiKey, libraries);
    return this._google;
  }

  mapAdapter() {
    if (!this._google) throw new Error("GoogleRuntime: not initialized.");
    return new GoogleMapAdapter(this._google);
  }

  geocodingAdapter() {
    if (!this._google) throw new Error("GoogleRuntime: not initialized.");
    return new GoogleGeocodingAdapter(this._google);
  }

  placesAdapter() {
    if (!this._google) throw new Error("GoogleRuntime: not initialized.");
    return new GooglePlacesAutocompleteAdapter(this._google);
  }
}
