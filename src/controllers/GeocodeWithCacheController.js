// FILE: src/controllers/GeocodeWithCacheController.js
// MODIFIED - Request adapter without specifying provider
import { AddressGeocodeCache } from "@/services/AddressGeocodeCache";
import { QuotaBackoffService } from "@/services/QuotaBackoffService";

/**
 * ARCHITECTURE: Composes cache, quota backoff for geocoding.
 * Uses injected GeoRuntime to get the configured geocoder adapter.
 */
export class GeocodeWithCacheController {
    constructor(
        geoRuntime,
        cache = new AddressGeocodeCache(),
        backoff = new QuotaBackoffService()
    ) {
        if (!geoRuntime) throw new Error("GeocodeWithCacheController requires GeoRuntime.");
        this.geoRuntime = geoRuntime;
        this.cache = cache;
        this.backoff = backoff;
        this._geocoderAdapter = null;
        // Lazy load
    }

    _getAdapter() {
        // *** FIX: Ensure GeoRuntime is initialized before requesting adapter ***
        // This relies on GeoRuntime.init() being called globally in main.js
        // or the router guard.
        if (!this._geocoderAdapter) {
            try {
                // Request the *configured* geocoding adapter
                this._geocoderAdapter = this.geoRuntime.geocodingAdapter();
                if(!this._geocoderAdapter) throw new Error("GeoRuntime returned null geocoding adapter.");
            } catch (e) {
                log.error("Failed to get configured geocoding adapter from GeoRuntime:", e);
                throw e; // Re-throw if no adapter available
            }
        }
        return this._geocoderAdapter;
    }


    async geocode(address) {
        const hit = this.cache.get(address);
        if (hit) {
            log.debug("[GeocodeCache] Cache hit for address:", address);
            return hit;
        }
        log.debug("[GeocodeCache] Cache miss for address:", address);

        // *** FIX: Ensure adapter is requested *before* task execution if not already loaded ***
        try {
            this._getAdapter();
        } catch (e) {
            log.error("[GeocodeCache] Cannot geocode, adapter unavailable:", e.message);
            return null;
        }
        // *** END FIX ***

        const task = async () => {
            const adapter = this._getAdapter();
            const run = () => adapter.geocodeAddress(address);
            const result = await this.backoff.execute(run);
            if (result && typeof result.latitude === 'number' && typeof result.longitude === 'number') {
                log.debug("[GeocodeCache] Geocode success, caching:", address, result);
                this.cache.put(address, result);
            } else {
                log.debug("[GeocodeCache] Geocode returned null/empty or invalid coordinates, not caching:", address);
            }
            return result;
        };

        return task();
    }
}

const log = {
    debug: (...args) => console.debug(...args),
    error: (...args) => console.error(...args),
};