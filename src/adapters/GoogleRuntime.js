// FILE: src/adapters/GoogleRuntime.js
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleMapAdapter } from "@/adapters/GoogleMapAdapter";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { GooglePlacesAutocompleteAdapter } from "@/adapters/GooglePlacesAutocompleteAdapter";

export class GoogleRuntime {
  constructor() {
    // Use the static loader instance
    this._loader = new GoogleMapsScriptLoader();
    this._google = null;
  }

  async init(apiKey, libraries = ["places", "geocoding"]) {
    // Check static property on the loader class
    if (GoogleMapsScriptLoader._promise) {
      this._google = await GoogleMapsScriptLoader._promise;
      return this._google;
    }
    // Call the instance method if not already loading/loaded
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