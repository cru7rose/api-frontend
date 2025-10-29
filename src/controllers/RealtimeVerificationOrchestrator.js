// FILE: src/controllers/RealtimeVerificationOrchestrator.js
// MODIFIED - Handle potentially null places adapter
import { DebounceTimer } from "@/services/DebounceTimer";
import { AddressSuggestionRanker } from "@/services/AddressSuggestionRanker";
import { SuggestionNormalizer } from "@/services/SuggestionNormalizer";
/**
 * ARCHITECTURE: Coordinates debounced input, geocode-with-cache, and optional places hints.
 * REFACTORED: Gets configured adapters from GeoRuntime.
 * Handles null places adapter gracefully.
 * *** FIX: Corrected constructor to accept GeoRuntime and GeocodeController. ***
 */
export class RealtimeVerificationOrchestrator {
    constructor(
        geoRuntime, // Inject GeoRuntime
        geocodeController, // Inject GeocodeWithCacheController
        debounceMs = 350
    ) {
        if (!geoRuntime || !geocodeController) throw new Error("GeoRuntime and GeocodeController are required.");
        this.geoRuntime = geoRuntime;
        this.geocode = geocodeController;

        // Attempt to get the *configured* places adapter, may be null
        try {
            this.places = this.geoRuntime.placesAdapter();
            // Returns null if config is 'none'
            if(this.places) {
                log.info("[RealtimeVerify] Places adapter successfully obtained.");
            } else {
                log.info("[RealtimeVerify] Places provider configured as 'none' or unavailable. Hints disabled.");
            }
        } catch(e) {
            log.warn("Could not get places adapter during RealtimeVerificationOrchestrator init:", e.message);
            this.places = null; // Ensure it's null on error
        }

        this.debouncer = new DebounceTimer(debounceMs);
        this.ranker = new AddressSuggestionRanker();
        this.normalizer = new SuggestionNormalizer();
    }

    async verify(baseInput) {
        return this.debouncer.run(async () => {
            const t0 = performance.now ? performance.now() : Date.now();

            const geocodePromise = this.geocode.geocode(baseInput);
            // Only call places if the adapter is available
            const placesPromise = this.places
                ? this.places.suggest(this._freeText(baseInput), baseInput.country || "PL")
                : Promise.resolve([]); // Resolve empty if no places adapter

            const [geoResult, placeRaw] = await Promise.all([geocodePromise, placesPromise]);

            const instant = geoResult
                ? this.mapGeoResultToSuggestion(geoResult, baseInput) // Use helper
                : null;

            // Normalize places results (will be empty if this.places is null)
            const placesSuggestions = this.normalizer.normalizeBatch(placeRaw, "PLACES_DETAIL"); // Assume details if Places ran

            const merged = instant ? [instant, ...placesSuggestions] : [...placesSuggestions];
            const ranked = this.ranker.rank(baseInput, merged);
            const t1 = performance.now ? performance.now() : Date.now();
            return { instant, suggestions: ranked, elapsedMs: Math.round(t1 - t0) };
        });
    }

    mapGeoResultToSuggestion(geoResult, baseInput, providerSource = "GEOCODER_CLIENT") {
        if (!geoResult) return null;
        // Determine provider source based on adapter type if possible
        let source = providerSource;
        if (geoResult._provider === 'Google') source = 'GOOGLE_CLIENT';
        else if (geoResult._provider === 'Nominatim') source = 'NOMINATIM_CLIENT';
        return {
            fullAddressLabel: geoResult._displayName || `${geoResult.street ||
            ''} ${geoResult.houseNumber || ''}, ${geoResult.postalCode || ''} ${geoResult.city || ''}`.replace(/ ,|,$/,'').trim(),
            street: geoResult.street ||
                null,
            houseNumber: geoResult.houseNumber ||
                null,
            postalCode: geoResult.postalCode ||
                null,
            city: geoResult.city ||
                null,
            countryCode: geoResult.country || baseInput?.country ||
                "PL",
            countryName: null,
            latitude: geoResult.latitude ??
                null,
            longitude: geoResult.longitude ??
                null,
            matchScore: geoResult._confidence ??
                0.8,
            matchLevel: geoResult._locationType || geoResult._osmType ||
                "GEOCODER",
            providerSource: source,
        };
    }

    _freeText(a) {
        const line1 = a?.houseNumber ? `${a.street ||
        ''} ${a.houseNumber}` : a?.street || "";
        return `${line1}, ${a?.postalCode || ""} ${a?.city || ""}`.trim();
    }
}

const log = {
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};