/**
 * ARCHITECTURE: AddressSuggestionMerger combines suggestion lists from multiple sources
 * (e.g., client-side geocoding, Places API, TES backend) into a single list,
 * potentially removing duplicates based on address content equality. Adheres to SRP.
 * This is a basic stub implementation assuming simple concatenation.
 */
import { AddressEqualityService } from "@/services/AddressEqualityService"; // Assuming this exists

export class AddressSuggestionMerger {
    constructor(equalityService = new AddressEqualityService()) {
        this.eq = equalityService;
    }

    /**
     * Merges multiple lists of suggestions, attempting basic deduplication.
     * @param {object} baseInput - The original input address (used for context, not currently in stub).
     * @param {Array<Array<object>>} suggestionLists - An array of suggestion lists from different sources.
     * @returns {Array<object>} A single, merged list of suggestions.
     */
    merge(baseInput, suggestionLists) {
        const merged = [];
        const seenHashes = new Set();

        if (!Array.isArray(suggestionLists)) {
            return merged;
        }

        for (const list of suggestionLists) {
            if (!Array.isArray(list)) continue;

            for (const suggestion of list) {
                if (!suggestion) continue;

                // Simple deduplication based on normalized address hash (requires AddressEqualityService)
                const addressPart = {
                    street: suggestion.street,
                    houseNumber: suggestion.houseNumber,
                    postalCode: suggestion.postalCode,
                    city: suggestion.city,
                    country: suggestion.countryCode,
                    // Note: Lat/Lon usually excluded from equality hash for address matching
                };
                const hash = this.eq.hash(addressPart);

                if (!seenHashes.has(hash)) {
                    merged.push(suggestion);
                    seenHashes.add(hash);
                }
            }
        }
        // Further sorting/ranking is typically done by AddressSuggestionRanker
        return merged;
    }
}