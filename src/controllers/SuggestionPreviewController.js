// ============================================================================
// Frontend: Update SuggestionPreviewController.js
// FILE: src/controllers/SuggestionPreviewController.js
// REASON: Update 'show' method to accept a 'side' parameter.
// ============================================================================
/**
 * ARCHITECTURE: SuggestionPreviewController coordinates map focusing for a chosen suggestion.
 * It follows the manifesto by isolating viewport behavior from editor and views.
 * REFACTORED: Now accepts a 'side' parameter.
 */
import { MapViewportPolicyController } from "@/controllers/MapViewportPolicyController";

export class SuggestionPreviewController {
  constructor(mapController) {
    this.map = mapController;
    this.policy = new MapViewportPolicyController(mapController);
  }

  /**
   * Shows a suggestion on the map for a specific side.
   * @param {'pickup' | 'delivery'} side
   * @param {object} suggestion
   */
  async show(side, suggestion) {
    if (!suggestion) return false;
    // Pass the side to the policy
    return await this.policy.focusSuggestion(side, suggestion);
  }
}