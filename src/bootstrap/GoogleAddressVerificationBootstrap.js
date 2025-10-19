/**
 * ARCHITECTURE: GoogleAddressVerificationBootstrap initializes Google runtime, map, and adapters for the editor.
 * It follows the manifesto by centralizing third-party setup and returning ready-to-use controllers/adapters.
 * Responsibilities:
 * - Load Google script, create MapController with GoogleMapAdapter, and provide geocoder + places adapters.
 */
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleMapAdapter } from "@/adapters/GoogleMapAdapter";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { GooglePlacesAutocompleteAdapter } from "@/adapters/GooglePlacesAutocompleteAdapter";
import { MapController } from "@/controllers/MapController";

export class GoogleAddressVerificationBootstrap {
  constructor(loader = new GoogleMapsScriptLoader()) {
    this.loader = loader;
    this.google = null;
    this.mapController = null;
    this.geocoderAdapter = null;
    this.placesAdapter = null;
  }

  async init(mapContainerEl, apiKey) {
    this.google = await this.loader.load(apiKey, ["places"]);
    const mapAdapter = new GoogleMapAdapter(this.google);
    this.mapController = new MapController(mapAdapter);
    await this.mapController.init(mapContainerEl, { lat: 52.2297, lon: 21.0122, zoom: 12 });
    this.geocoderAdapter = new GoogleGeocodingAdapter(this.google);
    this.placesAdapter = new GooglePlacesAutocompleteAdapter(this.google);
    return {
      google: this.google,
      mapController: this.mapController,
      geocoderAdapter: this.geocoderAdapter,
      placesAdapter: this.placesAdapter,
    };
  }
}
