// ============================================================================
// Frontend: Update GeoRuntime (Final Version)
// FILE: src/adapters/GeoRuntime.js
// REASON: Pass routing URL correctly, handle initialization errors gracefully.
// ============================================================================
// FILE: src/adapters/GeoRuntime.js
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";
import { GoogleMapAdapter } from "@/adapters/GoogleMapAdapter";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { GooglePlacesAutocompleteAdapter } from "@/adapters/GooglePlacesAutocompleteAdapter";
import { LeafletMapAdapter } from "@/adapters/LeafletMapAdapter";
import { NominatimGeocodingAdapter } from "@/adapters/NominatimGeocodingAdapter";

/**
 * ARCHITECTURE: Manages initialization and access for geographic service adapters.
 * REFACTORED: Passes OSRM routing URL (VITE_ROUTING_PROVIDER_URL) to LeafletMapAdapter. Handles errors better.
 */
export class GeoRuntime {
    constructor(providerConfig = {}) {
        this._config = {
            map: (providerConfig.map || 'leaflet').toLowerCase(),
            geocode: (providerConfig.geocode || 'nominatim').toLowerCase(),
            places: (providerConfig.places || 'none').toLowerCase(),
            nominatimEmail: providerConfig.nominatimEmail || 'danxils-triage@example.com',
            nominatimUrl: providerConfig.nominatimUrl || null,
            routingUrl: providerConfig.routingUrl || null,
        };
        log.info(`[GeoRuntime] Configured Providers - Map: ${this._config.map}, Geocode: ${this._config.geocode}, Places: ${this._config.places}, Routing: ${this._config.routingUrl ? 'OSRM' : 'None'}`);

        this._googleLoader = new GoogleMapsScriptLoader();
        this._googleInstance = null;
        this._googleApiKey = null;
        this._googleLibs = ["places", "geocoding", "marker"];
        this._googleMapAdapterInstance = null;
        this._googleGeocodingAdapterInstance = null;
        this._googlePlacesAdapterInstance = null;

        this._leafletMapAdapterInstance = null;
        this._nominatimGeocodingAdapterInstance = null;

        this._initializationPromise = null;
        this._isGoogleInitialized = false;
        this._isNonGoogleInitialized = false;
    }

    async init(googleApiKey = null) {
        if (this._initializationPromise) return this._initializationPromise;

        this._googleApiKey = googleApiKey;
        const needsGoogle = this._config.map === 'google' || this._config.geocode === 'google' || this._config.places === 'google';

        const initNonGooglePromise = Promise.resolve().then(() => {
            try {
                if (this._config.map === 'leaflet' && !this._leafletMapAdapterInstance) {
                    this._leafletMapAdapterInstance = new LeafletMapAdapter(this._config.routingUrl);
                    log.info("[GeoRuntime] LeafletMapAdapter instantiated.");
                }
                if (this._config.geocode === 'nominatim' && !this._nominatimGeocodingAdapterInstance) {
                    this._nominatimGeocodingAdapterInstance = new NominatimGeocodingAdapter(this._config.nominatimUrl, this._config.nominatimEmail);
                    log.info("[GeoRuntime] NominatimGeocodingAdapter instantiated.");
                }
                this._isNonGoogleInitialized = true;
            } catch(e) {
                log.error("[GeoRuntime] Failed to instantiate non-Google adapters:", e);
                this._isNonGoogleInitialized = false;
            }
        });

        if (needsGoogle && this._googleApiKey) {
            log.info("[GeoRuntime] Google provider configured and API Key provided. Loading Google Maps script...");
            this._initializationPromise = Promise.all([
                initNonGooglePromise,
                this._googleLoader.load(this._googleApiKey, this._googleLibs)
                    .then(google => {
                        this._googleInstance = google;
                        try {
                            if (this._config.map === 'google') this._googleMapAdapterInstance = new GoogleMapAdapter(this._googleInstance);
                            if (this._config.geocode === 'google') this._googleGeocodingAdapterInstance = new GoogleGeocodingAdapter(this._googleInstance);
                            if (this._config.places === 'google') this._googlePlacesAdapterInstance = new GooglePlacesAutocompleteAdapter(this._googleInstance);
                            this._isGoogleInitialized = true;
                            log.info("[GeoRuntime] Google Maps script loaded successfully. Relevant adapters created.");
                            return true;
                        } catch (adapterError) {
                            log.error("[GeoRuntime] Error creating Google adapters after script load:", adapterError);
                            this._isGoogleInitialized = false;
                            return false;
                        }
                    })
                    .catch(err => {
                        log.error("[GeoRuntime] Failed to load Google Maps script:", err.message);
                        this._googleInstance = null;
                        this._isGoogleInitialized = false;
                        return false;
                    })
            ]).then(() => this._isGoogleInitialized || this._isNonGoogleInitialized);
        } else {
            if (needsGoogle && !this._googleApiKey) {
                log.warn("[GeoRuntime] Google provider configured but no API Key provided. Google features unavailable.");
            }
            this._initializationPromise = initNonGooglePromise.then(() => this._isNonGoogleInitialized);
        }
        return this._initializationPromise;
    }

    mapAdapter() {
        const provider = this._config.map;
        if (provider === 'google') {
            if (!this._isGoogleInitialized || !this._googleMapAdapterInstance) {
                throw new Error("GeoRuntime: Google Maps not initialized or map adapter failed. Cannot get GoogleMapAdapter.");
            }
            return this._googleMapAdapterInstance;
        }
        if (provider === 'leaflet') {
            if (!this._leafletMapAdapterInstance) {
                throw new Error("GeoRuntime: Leaflet Map adapter not initialized.");
            }
            return this._leafletMapAdapterInstance;
        }
        throw new Error(`GeoRuntime: No map adapter configured or available for provider: ${provider}`);
    }

    geocodingAdapter() {
        const provider = this._config.geocode;
        if (provider === 'google') {
            if (!this._isGoogleInitialized || !this._googleGeocodingAdapterInstance) {
                throw new Error("GeoRuntime: Google Maps not initialized or geocoding adapter failed. Cannot get GoogleGeocodingAdapter.");
            }
            return this._googleGeocodingAdapterInstance;
        }
        if (provider === 'nominatim') {
            if (!this._nominatimGeocodingAdapterInstance) {
                throw new Error("GeoRuntime: Nominatim Geocoding adapter not initialized.");
            }
            return this._nominatimGeocodingAdapterInstance;
        }
        throw new Error(`GeoRuntime: No geocoding adapter configured or available for provider: ${provider}`);
    }

    placesAdapter() {
        const provider = this._config.places;
        if (provider === 'google') {
            if (!this._isGoogleInitialized || !this._googlePlacesAdapterInstance) {
                log.warn("GeoRuntime: Google Places requested but not initialized or adapter failed.");
                return null;
            }
            return this._googlePlacesAdapterInstance;
        }
        if (provider === 'none') {
            return null;
        }
        log.warn(`GeoRuntime: Places adapter requested for unsupported provider: ${provider}`);
        return null;
    }

    isGoogleReady() {
        return this._isGoogleInitialized;
    }

    isProviderReady(type = 'map' | 'geocode' | 'places', providerName = null) {
        if (!this._initializationPromise) return false;

        const targetProvider = (providerName || this._config[type]).toLowerCase();

        if(targetProvider === 'google') return this.isGoogleReady();
        if(targetProvider === 'leaflet' && type === 'map') return !!this._leafletMapAdapterInstance;
        if(targetProvider === 'nominatim' && type === 'geocode') return !!this._nominatimGeocodingAdapterInstance;
        if(targetProvider === 'none' && type === 'places') return true;

        log.warn(`[GeoRuntime] Readiness check for unknown or uninitialized provider type/name: ${type}/${targetProvider}`);
        return false;
    }
}

// Basic logger shim
const log = {
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};