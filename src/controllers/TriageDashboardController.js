// ============================================================================
// Frontend: Fix TriageDashboardController (Supersedes previous version)
// FILE: src/controllers/TriageDashboardController.js
// REASON: Remove call to non-existent 'getRecentBatches' method
//         which is not implemented in AddressExceptionApi.js.
// ============================================================================
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { PollingService } from "@/services/PollingService";

export class TriageDashboardController {
  constructor(api = new AddressExceptionApi(), polling = new PollingService()) {
    this.api = api;
    this.polling = polling;
    this.loading = false;
    this.error = null;
    this.kpis = null;
    this.recentBatches = []; // Keep property but will remain empty
    this.pendingByErrorType = [];
    this._pollHandles = [];
  }

  async loadAll() {
    this.loading = true;
    this.error = null;

    // *** MODIFICATION: Removed getRecentBatches() call ***
    const [kpiRes, typeRes] = await Promise.all([
      this.api.getTriageKpis(),
      // this.api.getRecentBatches(), // <-- This line is REMOVED
      this.api.getPendingByErrorType(),
    ]);
    // *** END MODIFICATION ***

    // Safety check for kpiRes
    if (!kpiRes.ok) return this._fail(kpiRes.error);
    if (!kpiRes.value) {
      console.warn("TriageDashboardController: getTriageKpis returned OK but value is null/undefined.");
      this.kpis = { pendingReviewCount: 0, automatedClearancePercent: 0, avgResolutionMinutes: null };
    } else {
      this.kpis = kpiRes.value;
    }

    // Safety check for batchRes (Set to empty array)
    this.recentBatches = []; // Will not be populated

    // Safety check for typeRes
    if (!typeRes.ok) return this._fail(typeRes.error);
    this.pendingByErrorType = Array.isArray(typeRes.value) ? typeRes.value : [];

    this.loading = false;
    return Result.ok(this.snapshot());
  }

  startPolling(intervalMs = 10000) {
    this.stopPolling();
    const k = this.polling.start("kpis", intervalMs, async () => {
      const r = await this.api.getTriageKpis();
      if (r.ok && r.value) this.kpis = r.value;
    });

    // *** MODIFICATION: Removed polling for batches ***
    // const b = this.polling.start(...)
    // *** END MODIFICATION ***

    const e = this.polling.start("errorsByType", intervalMs, async () => {
      const r = await this.api.getPendingByErrorType();
      if (r.ok) this.pendingByErrorType = Array.isArray(r.value) ? r.value : [];
    });

    this._pollHandles = [k, e]; // Removed 'b' from handles
    return this._pollHandles.slice();
  }

  stopPolling() {
    this.polling.stopAll();
    this._pollHandles = [];
  }

  snapshot() {
    return {
      loading: this.loading,
      error: this.error,
      kpis: this.kpis,
      recentBatches: this.recentBatches.slice(),
      pendingByErrorType: this.pendingByErrorType.slice(),
    };
  }

  _fail(err) {
    this.loading = false;
    this.error = err?.message || "Dashboard load failed.";
    return Result.fail(err);
  }
}