/**
 * ARCHITECTURE: SuggestionPreviewService creates a non-destructive preview Address object from a suggestion.
 * It follows the manifesto by isolating conversion rules away from editor state and components.
 * Responsibilities:
 * - Convert a suggestion DTO to an Address-like object the map can display without committing changes.
 */
export class SuggestionPreviewService {
  toAddressLike(s) {
    if (!s) return null;
    return {
      street: s.street || "",
      houseNumber: s.houseNumber || null,
      postalCode: s.postalCode || "",
      city: s.city || "",
      country: s.countryCode || s.country || "PL",
      latitude: typeof s.latitude === "number" ? s.latitude : null,
      longitude: typeof s.longitude === "number" ? s.longitude : null,
    };
  }
}
