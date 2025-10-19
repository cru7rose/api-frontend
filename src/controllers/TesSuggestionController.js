/**
 * ARCHITECTURE: TesSuggestionController starts TES suggest/search operations and collects results via poller.
 * It follows the manifesto by separating TES IO from UI and merging outputs through a stable contract.
 * Responsibilities:
 * - Trigger suggest-on-demand or search-by-name; poll until done; return normalized suggestions.
 * - Delegate normalization/merging to provided collaborators without leaking TES DTOs to callers.
 */
import apiClient from "@/services/api";
import { TesOperationPoller } from "@/services/TesOperationPoller";
import { SuggestionNormalizer } from "@/services/SuggestionNormalizer";
import { AddressSuggestionMerger } from "@/services/AddressSuggestionMerger";
import { AddressSuggestionRanker } from "@/services/AddressSuggestionRanker";

export class TesSuggestionController {
  constructor(poller = new TesOperationPoller(), normalizer = new SuggestionNormalizer(), merger = new AddressSuggestionMerger(), ranker = new AddressSuggestionRanker()) {
    this.poller = poller;
    this.normalizer = normalizer;
    this.merger = merger;
    this.ranker = ranker;
  }

  async suggestOnDemand(addressDto, baseInputForRanking = null) {
    const start = await apiClient.post("/api/admin/address-verification/suggest-on-demand", addressDto);
    const cid = start?.data?.correlationId;
    if (!cid) throw new Error("TesSuggestionController: missing correlationId.");
    const done = await this.poller.waitFor(cid);
    if (done.status !== "COMPLETED") return [];
    const raw = done.result?.suggestions || [];
    const normalized = this.normalizer.normalizeBatch(raw, "TES");
    const merged = this.merger.merge(baseInputForRanking || addressDto, [normalized]);
    return this.ranker.rank(baseInputForRanking || addressDto, merged);
  }

  async searchByName(query, baseInputForRanking = null) {
    const start = await apiClient.post("/api/admin/address-verification/search-by-name", query, { headers: { "Content-Type": "text/plain" } });
    const cid = start?.data?.correlationId;
    if (!cid) throw new Error("TesSuggestionController: missing correlationId.");
    const done = await this.poller.waitFor(cid);
    if (done.status !== "COMPLETED") return [];
    const raw = done.result?.suggestions || [];
    const normalized = this.normalizer.normalizeBatch(raw, "TES");
    const merged = this.merger.merge(baseInputForRanking || {}, [normalized]);
    return this.ranker.rank(baseInputForRanking || {}, merged);
  }
}
