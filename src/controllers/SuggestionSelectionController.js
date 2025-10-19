/**
 * ARCHITECTURE: SuggestionSelectionController selects and applies suggestions deterministically.
 * It follows the manifesto by keeping scoring and application separate from UI and transport.
 * Responsibilities:
 * - Pick the best suggestion; apply a chosen index to the editor facade for a given side.
 */
export class SuggestionSelectionController {
  best(baseInput, suggestions) {
    const list = Array.isArray(suggestions) ? suggestions : [];
    if (!list.length) return null;
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < list.length; i++) {
      const s = list[i] || {};
      const score = this._score(baseInput, s);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return { index: bestIndex, suggestion: list[bestIndex] };
  }

  accept(editorFacade, side, sel) {
    if (!sel || typeof sel.index !== "number") return false;
    if (side === "pickup") {
      const r = editorFacade.acceptPickupSuggestion(sel.index);
      return !!r?.ok;
    }
    if (side === "delivery") {
      const r = editorFacade.acceptDeliverySuggestion(sel.index);
      return !!r?.ok;
    }
    return false;
  }

  _score(base, sug) {
    let score = 0;
    if (typeof sug.matchScore === "number") score += sug.matchScore * 100;
    if (this._eq(base?.city, sug?.city)) score += 5;
    if (this._eq(base?.postalCode, sug?.postalCode)) score += 10;
    if (this._eq(base?.street, sug?.street)) score += 3;
    return score;
  }

  _eq(a, b) {
    return (a || "").toString().trim().toLowerCase() === (b || "").toString().trim().toLowerCase();
  }
}
