// ============================================================================
// Frontend: Update NominatimGeocodingAdapter
// FILE: src/adapters/NominatimGeocodingAdapter.js
// REASON: Change hardcoded default URL to use the '/nominatim/search.php' proxy path.
// REASON: Remove hardcoded '/search' path, as it's now in the config URL.
// REASON (FIX): Correctly build query params, sending 'street' and 'houseNumber'
//               separately instead of incorrectly combining them.
// ============================================================================
// FILE: src/adapters/NominatimGeocodingAdapter.js
import { AddressNormalizer } from '@/services/AddressNormalizer';
/**
 * ARCHITECTURE: NominatimGeocodingAdapter wraps OpenStreetMap Nominatim API for geocoding.
 * REFACTORED: Default URL now points to the proxy path '/nominatim/search.php'.
 * REFACTORED: Adapter no longer appends '/search'.
 * FIX: Correctly builds query, separating street and houseNumber.
 */
export class NominatimGeocodingAdapter {
    constructor(nominatimUrl, email) {
        // *** FIX: Apply defaults internally to handle null/undefined inputs ***
        const effectiveUrl = nominatimUrl ||
            '/nominatim/search.php'; // *** UPDATED DEFAULT ***
        const effectiveEmail = email || 'triage-app@example.com';
// *** END FIX ***

        this.baseUrl = effectiveUrl.replace(/\/+$/, "");
        this.email = effectiveEmail;
        this.normalizer = new AddressNormalizer();
        this.fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': `DanxilsTriageApp/1.0 (${this.email})`,
            },
        };
    }

    async geocodeAddress(address) {
        if (!address || !address.street || !address.postalCode || !address.city) {
            console.warn("[Nominatim] Geocode skipped: Missing required fields (street, postalCode, city).");
            return null;
        }

        // *** FIX: Build parameters correctly ***
        const params = new URLSearchParams({
            // street: `${address.houseNumber || ''} ${address.street || ''}`.trim(), // <-- OLD BUGGY LINE
            street: address.street || '', // Send street
            city: address.city || '',
            postalcode: address.postalCode || '',
            country: address.country || 'PL',
            format: 'jsonv2',
            addressdetails: '1',
            limit: '1',
            email: this.email,
        });

        // Only add houseNumber to the query if it's present
        if (address.houseNumber && String(address.houseNumber).trim()) {
            params.set('street', `${String(address.houseNumber).trim()} ${address.street || ''}`);
        }
        // *** END FIX ***

        // *** FIX: No longer appends '/search' ***
        const url = `${this.baseUrl}?${params.toString()}`;
        // *** END FIX ***

        const queryDesc = `${params.get('street')}, ${params.get('postalcode')} ${params.get('city')}`;
        log.debug(`[Nominatim] Geocoding query: ${queryDesc}`);
        try {
            const response = await fetch(url, this.fetchOptions);
            if (!response.ok) {
                const errorBody = await response.text();
                log.error(`[Nominatim] API error ${response.status} for query '${queryDesc}'. Body: ${errorBody}`);
                throw new Error(`Nominatim API error ${response.status}`);
            }
            const results = await response.json();
            if (!Array.isArray(results) || results.length === 0) {
                log.warn(`[Nominatim] No results found for query: ${queryDesc}`);
                return null;
            }
            const best = results[0];
            const components = best.address || {};
            const lat = best.lat ? parseFloat(best.lat) : null;
            const lon = best.lon ?
                parseFloat(best.lon) : null;

            if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
                log.warn(`[Nominatim] Result for query '${queryDesc}' missing valid coordinates. Lat: ${best.lat}, Lon: ${best.lon}`);
                return null;
            }

            const normalized = {
                street: components.road ||
                    address.street || null,
                houseNumber: components.house_number ||
                    address.houseNumber || null,
                postalCode: components.postcode ||
                    address.postalCode || null,
                city: components.city ||
                    components.town || components.village || address.city || null,
                country: (components.country_code || address.country || 'pl').toUpperCase(),
                latitude: lat,
                longitude: lon,
                _provider: 'Nominatim',
                _displayName: best.display_name,
                _osmType: best.osm_type,
                _osmId: best.osm_id,
                _confidence: best.importance ?
                    parseFloat(best.importance) : null,
            };
            log.debug(`[Nominatim] Geocode success for query '${queryDesc}'. Result: Lat=${normalized.latitude}, Lon=${normalized.longitude}`);
            return normalized;
        } catch (error) {
            log.error(`[Nominatim] Network or processing error during geocode for query '${queryDesc}': ${error.message}`, error);
            return null;
        }
    }
}

const log = {
    debug: (...args) => console.debug(...args),
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};