/**
 * ARCHITECTURE: QuickAcceptController enables one-click "best suggestion" acceptance per side.
 * It follows the manifesto by composing SuggestionSelectionController and EditorFacade.
 * Responsibilities:
 * - Compute best suggestion for the current input and apply it; return the applied index or null.
 */
import { SuggestionSelectionController } from "@/controllers/SuggestionSelectionController";

export class QuickAcceptController {
  constructor() {
    this.selector = new SuggestionSelectionController();
  }

  applyBest(side, baseInput, suggestions, editorFacade) {
    const best = this.selector.best(baseInput, suggestions);
    if (!best) return null;
    if (side === "pickup") editorFacade.acceptPickupSuggestion(best.index);
    if (side === "delivery") editorFacade.acceptDeliverySuggestion(best.index);
    return best.index;
  }
}
