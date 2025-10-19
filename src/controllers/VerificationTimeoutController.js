/**
 * ARCHITECTURE: VerificationTimeoutController applies latency budgets to geocode and suggestion steps.
 * It follows the manifesto by composing LatencyBudget with provider adapters to keep UI responsive.
 * Responsibilities:
 * - Run geocode and suggestions with independent timeouts; return partial results when needed.
 * - Provide verifyWithin() that yields {instant,suggestions,elapsed:{geo,suggest}}.
 */
import { LatencyBudget } from "@/services/LatencyBudget";

export class VerificationTimeoutController {
  constructor(geocodeController, placesAdapter, tesController, budget = new LatencyBudget()) {
    this.geocode = geocodeController;
    this.places = placesAdapter;
    this.tes = tesController;
    this.budget = budget;
  }

  async verifyWithin(baseInput, ms = 1200) {
    const geo = await this.budget.runWithTimeout(() => this.geocode.geocode(baseInput), ms, null);
    const places = await this.budget.runWithTimeout(
      () => (this.places ? this.places.suggest(this._freeText(baseInput), baseInput.country || "PL") : Promise.resolve([])),
      ms,
      []
    );
    const tes = await this.budget.runWithTimeout(() => this.tes.suggestOnDemand(baseInput, baseInput), ms * 2, []);
    return {
      instant: geo.value ? { latitude: geo.value.lat ?? null, longitude: geo.value.lon ?? null } : null,
      suggestions: ([]).concat(places.value || []).concat(tes.value || []),
      elapsed: { geocodeMs: geo.elapsedMs, placesMs: places.elapsedMs, tesMs: tes.elapsedMs },
    };
  }

  _freeText(a) {
    const line1 = a.houseNumber ? `${a.street} ${a.houseNumber}` : a.street || "";
    return `${line1}, ${a.postalCode || ""} ${a.city || ""}`.trim();
  }
}
