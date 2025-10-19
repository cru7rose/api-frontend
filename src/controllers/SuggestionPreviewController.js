/**
 * ARCHITECTURE: SuggestionPreviewController coordinates map focusing for a chosen suggestion.
 * It follows the manifesto by isolating viewport behavior from editor and views.
 * Responsibilities:
 * - Show a suggestion on the map by updating marker and recentering using MapViewportPolicyController.
 */
import { MapViewportPolicyController } from "@/controllers/MapViewportPolicyController";

export class SuggestionPreviewController {
  constructor(mapController) {
    this.map = mapController;
    this.policy = new MapViewportPolicyController(mapController);
  }

  async show(suggestion) {
    if (!suggestion) return false;
    return await this.policy.focusSuggestion(suggestion);
  }
}
