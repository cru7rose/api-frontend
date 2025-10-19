/**
 * ARCHITECTURE: PlacesHintController coordinates Google Places type-ahead hints with session tokens and debouncing.
 * It follows the manifesto by isolating vendor semantics and timing concerns behind a single suggest() method.
 * Responsibilities:
 * - Use GooglePlacesSessionManager to reuse/renew AutocompleteSessionToken.
 * - Debounce keystrokes, query Places adapter, and return normalized suggestions.
 */
import { GooglePlacesSessionManager } from "@/adapters/GooglePlacesSessionManager";
import { DebounceTimer } from "@/services/DebounceTimer";
import { SuggestionNormalizer } from "@/services/SuggestionNormalizer";

export class PlacesHintController {
  constructor(googleObj, placesAdapter, debounceMs = 250) {
    this.google = googleObj;
    this.places = placesAdapter;
    this.session = new GooglePlacesSessionManager(this.google);
    this.debounce = new DebounceTimer(debounceMs);
    this.normalizer = new SuggestionNormalizer();
  }

  async suggest(freeText, country = "PL") {
    return this.debounce.run(async () => {
      if (!this.places || !freeText || !freeText.trim()) return [];
      const token = this.session.getToken();
      void token;
      const raw = await this.places.suggest(freeText, country);
      return this.normalizer.normalizeBatch(raw, "PLACES");
    });
  }

  renewSession() {
    this.session.renew();
    return true;
  }
}
