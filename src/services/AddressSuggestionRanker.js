/**
 * ARCHITECTURE: AddressSuggestionRanker orders suggestions by confidence and locality relevance.
 * It follows the manifesto by keeping ranking policy separate from UI and transport details.
 * Responsibilities:
 * - Sort by matchScore desc, then city/postal match with the base input, then provider priority.
 */
export class AddressSuggestionRanker {
  rank(baseInput, list) {
    const arr = Array.isArray(list) ? list.slice() : [];
    const prio = (p) => (p === "GOOGLE_CLIENT" ? 3 : p === "GOOGLE_PLACES" ? 2 : p === "TES" ? 1 : 0);
    const eq = (a, b) => (a || "").toString().trim().toLowerCase() === (b || "").toString().trim().toLowerCase();
    arr.sort((a, b) => {
      const sa = typeof a.matchScore === "number" ? a.matchScore : 0;
      const sb = typeof b.matchScore === "number" ? b.matchScore : 0;
      if (sb !== sa) return sb - sa;
      const ca = eq(a.city, baseInput?.city) ? 1 : 0;
      const cb = eq(b.city, baseInput?.city) ? 1 : 0;
      if (cb !== ca) return cb - ca;
      const pa = eq(a.postalCode, baseInput?.postalCode) ? 1 : 0;
      const pb = eq(b.postalCode, baseInput?.postalCode) ? 1 : 0;
      if (pb !== pa) return pb - pa;
      return prio(b.providerSource) - prio(a.providerSource);
    });
    return arr;
  }
}
