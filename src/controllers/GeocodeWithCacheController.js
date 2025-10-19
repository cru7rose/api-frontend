/**
 * ARCHITECTURE: GeocodeWithCacheController composes cache, quota backoff, and a verification queue for geocoding.
 * It follows the manifesto by isolating resilience and performance concerns behind a single geocode() method.
 * Responsibilities:
 * - Check in-memory cache, enqueue the provider call, and apply quota backoff on retryable errors.
 * - Store successful results back to cache with TTL.
 */
import { AddressGeocodeCache } from "@/services/AddressGeocodeCache";
import { QuotaBackoffService } from "@/services/QuotaBackoffService";
import { VerificationQueueController } from "@/controllers/VerificationQueueController";

export class GeocodeWithCacheController {
  constructor(geocoderAdapter, cache = new AddressGeocodeCache(), backoff = new QuotaBackoffService(), queue = new VerificationQueueController(2)) {
    this.geocoder = geocoderAdapter;
    this.cache = cache;
    this.backoff = backoff;
    this.queue = queue;
  }

  async geocode(address) {
    const hit = this.cache.get(address);
    if (hit) return hit;
    const task = async () => {
      const run = () => this.geocoder.geocodeAddress(address);
      const result = await this.backoff.execute(run);
      if (result) this.cache.put(address, result);
      return result;
    };
    return this.queue.enqueue(task);
  }
}
