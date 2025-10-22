// FILE: controllers/GeocodeWithCacheController.js
/**
 * ARCHITECTURE: GeocodeWithCacheController composes cache, quota backoff for geocoding.
 * It follows the manifesto by isolating resilience and performance concerns behind a single geocode() method.
 * Responsibilities:
 * - Check in-memory cache, call the provider, and apply quota backoff on retryable errors.
 * - Store successful results back to cache with TTL.
 * REFACTORED: Removed VerificationQueueController dependency as it's being removed. Direct calls are now made.
 */
import { AddressGeocodeCache } from "@/services/AddressGeocodeCache";
import { QuotaBackoffService } from "@/services/QuotaBackoffService";
// REMOVED: import { VerificationQueueController } from "@/controllers/VerificationQueueController";

export class GeocodeWithCacheController {
    constructor(
        geocoderAdapter,
        cache = new AddressGeocodeCache(),
        backoff = new QuotaBackoffService()
        // REMOVED: queue dependency
    ) {
        this.geocoder = geocoderAdapter;
        this.cache = cache;
        this.backoff = backoff;
        // REMOVED: this.queue = queue;
    }

    async geocode(address) {
        const hit = this.cache.get(address);
        if (hit) {
            // console.debug("Geocode cache hit:", address);
            return hit;
        }
        // console.debug("Geocode cache miss:", address);

        // Directly execute the task with backoff, removing the queue layer
        const task = async () => {
            const run = () => this.geocoder.geocodeAddress(address);
            const result = await this.backoff.execute(run);
            if (result) {
                // console.debug("Geocode success, caching:", address, result);
                this.cache.put(address, result);
            } else {
                // console.debug("Geocode returned null/empty, not caching:", address);
            }
            return result;
        };

        // Replace queue enqueue with direct execution
        return task();
        // REMOVED: return this.queue.enqueue(task);
    }
}