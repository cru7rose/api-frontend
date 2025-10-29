import { AddressEqualityService } from "@/services/AddressEqualityService";

/**
 * ARCHITECTURE: AddressGeocodeCache provides an in-memory, session-scoped cache
 * for geocoding results to reduce API calls.
 * It uses AddressEqualityService to create stable keys from address objects.
 */
export class AddressGeocodeCache {
    constructor(equalityService = new AddressEqualityService()) {
        this.cache = new Map();
        this.eq = equalityService;
    }

    _key(address) {
        // Use the hash function from the equality service for a stable key
        return this.eq.hash(address);
    }

    get(address) {
        const key = this._key(address);
        const result = this.cache.get(key) || null;
        if (result) {
            console.debug(`[GeocodeCache] Cache HIT for key: ${key}`);
        }
        return result;
    }

    put(address, result) {
        const key = this._key(address);
        console.debug(`[GeocodeCache] Cache SET for key: ${key}`);
        this.cache.set(key, result);
    }

    clear() {
        this.cache.clear();
    }
}
