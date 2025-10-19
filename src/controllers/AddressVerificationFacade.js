/**
 * ARCHITECTURE: AddressVerificationFacade provides a minimal API to run Google-first verification end-to-end.
 * It follows the manifesto by composing workflow, merger, ranker, and TES suggestions behind a single call.
 * Responsibilities:
 * - Accept an Address-like DTO; return {normalized, validation, instant, suggestions} ready for the editor.
 * - Optionally enrich with TES suggestions and merge/rank them alongside Google-derived candidates.
 */
import { AddressVerificationWorkflow } from "@/controllers/AddressVerificationWorkflow";
import { TesSuggestionController } from "@/controllers/TesSuggestionController";
import { AddressSuggestionMerger } from "@/services/AddressSuggestionMerger";
import { AddressSuggestionRanker } from "@/services/AddressSuggestionRanker";

export class AddressVerificationFacade {
  constructor(googleApiKey, tes = new TesSuggestionController(), merger = new AddressSuggestionMerger(), ranker = new AddressSuggestionRanker()) {
    this.workflow = new AddressVerificationWorkflow(googleApiKey);
    this.tes = tes;
    this.merger = merger;
    this.ranker = ranker;
  }

  async verify(address) {
    const base = await this.workflow.verify(address);
    if (!base.success) return base;
    const tes = await this.tes.suggestOnDemand(base.normalized, base.normalized);
    const merged = this.merger.merge(base.normalized, [base.suggestions, tes]);
    const ranked = this.ranker.rank(base.normalized, merged);
    return { ...base, suggestions: ranked };
  }
}
