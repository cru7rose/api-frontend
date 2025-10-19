/**
 * ARCHITECTURE: RealtimeVerificationOrchestrator coordinates debounced input, geocode-with-cache, and places hints.
 * It follows the manifesto by composing small services to provide a single verify() for live user typing.
 * Responsibilities:
 * - Debounce the input, validate and normalize externally, then call geocode and places in parallel.
 * - Return a deterministic structure with instant geocode, ranked suggestions, and timing info.
 */
import { DebounceTimer } from "@/services/DebounceTimer";
import { AddressSuggestionRanker } from "@/services/AddressSuggestionRanker";
import { SuggestionNormalizer } from "@/services/SuggestionNormalizer";

export class RealtimeVerificationOrchestrator {
  constructor(geocodeController, placesAdapter, debounceMs = 350) {
    this.geocode = geocodeController;
    this.places = placesAdapter;
    this.debouncer = new DebounceTimer(debounceMs);
    this.ranker = new AddressSuggestionRanker();
    this.normalizer = new SuggestionNormalizer();
  }

  async verify(baseInput) {
    return this.debouncer.run(async () => {
      const t0 = performance.now ? performance.now() : Date.now();
      const [geo, placeRaw] = await Promise.all([
        this.geocode.geocode(baseInput),
        this.places ? this.places.suggest(this._freeText(baseInput), baseInput.country || "PL") : Promise.resolve([]),
      ]);
      const instant = geo
        ? {
            fullAddressLabel: null,
            street: baseInput.street || null,
            houseNumber: baseInput.houseNumber || null,
            postalCode: baseInput.postalCode || null,
            city: baseInput.city || null,
            countryCode: baseInput.country || "PL",
            countryName: null,
            latitude: geo.lat ?? null,
            longitude: geo.lon ?? null,
            matchScore: 1.0,
            matchLevel: "GEOCODER",
            providerSource: "GOOGLE_CLIENT",
          }
        : null;
      const places = this.normalizer.normalizeBatch(placeRaw, "PLACES");
      const merged = instant ? [instant, ...places] : places.slice();
      const ranked = this.ranker.rank(baseInput, merged);
      const t1 = performance.now ? performance.now() : Date.now();
      return { instant, suggestions: ranked, elapsedMs: Math.round(t1 - t0) };
    });
  }

  _freeText(a) {
    const line1 = a.houseNumber ? `${a.street} ${a.houseNumber}` : a.street || "";
    return `${line1}, ${a.postalCode || ""} ${a.city || ""}`.trim();
  }
}
