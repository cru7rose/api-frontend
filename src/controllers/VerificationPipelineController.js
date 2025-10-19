/**
 * ARCHITECTURE: VerificationPipelineController composes timeout, merger, and ranking into a single step.
 * It follows the manifesto by hiding orchestration details behind a single run() method.
 * Responsibilities:
 * - Execute geocode + places + TES with budgets; merge and rank; return final suggestions list.
 */
import { VerificationTimeoutController } from "@/controllers/VerificationTimeoutController";
import { AddressSuggestionMerger } from "@/services/AddressSuggestionMerger";
import { AddressSuggestionRanker } from "@/services/AddressSuggestionRanker";

export class VerificationPipelineController {
  constructor(timeoutController, merger = new AddressSuggestionMerger(), ranker = new AddressSuggestionRanker()) {
    this.timeout = timeoutController;
    this.merger = merger;
    this.ranker = ranker;
  }

  async run(baseInput, ms = 1500) {
    const phased = await this.timeout.verifyWithin(baseInput, ms);
    const merged = this.merger.merge(baseInput, [phased.suggestions]);
    const ranked = this.ranker.rank(baseInput, merged);
    return { instant: phased.instant, suggestions: ranked, elapsed: phased.elapsed };
  }
}
