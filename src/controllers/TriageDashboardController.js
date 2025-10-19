/**
 * ARCHITECTURE: TriageDashboardController orchestrates KPI tiles, batch/source lists, and error-type groupings.
 * It follows the manifesto by separating read-model orchestration from UI and router glue.
 * Responsibilities:
 * - Load KPIs, recent batches, and pending-by-error-type using AddressExceptionApi.
 * - Expose immutable snapshots for rendering.
 * - Integrate PollingService to keep the dashboard fresh without duplicating timers.
 */
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
    this.recentBatches = [];
    this.pendingByErrorType = [];
    this._pollHandles = [];
  }

  async loadAll() {
    this.loading = true;
    this.error = null;
    const [kpiRes, batchRes, typeRes] = await Promise.all([
      this.api.getTriageKpis(),
      this.api.getRecentBatches(),
      this.api.getPendingByErrorType(),
    ]);
    if (!kpiRes.ok) return this._fail(kpiRes.error);
    if (!batchRes.ok) return this._fail(batchRes.error);
    if (!typeRes.ok) return this._fail(typeRes.error);
    this.kpis = kpiRes.value;
    this.recentBatches = Array.isArray(batchRes.value) ? batchRes.value : [];
    this.pendingByErrorType = Array.isArray(typeRes.value) ? typeRes.value : [];
    this.loading = false;
    return Result.ok(this.snapshot());
  }

  startPolling(intervalMs = 10000) {
    this.stopPolling();
    const k = this.polling.start("kpis", intervalMs, async () => {
      const r = await this.api.getTriageKpis();
      if (r.ok) this.kpis = r.value;
    });
    const b = this.polling.start("batches", intervalMs, async () => {
      const r = await this.api.getRecentBatches();
      if (r.ok) this.recentBatches = Array.isArray(r.value) ? r.value : [];
    });
    const e = this.polling.start("errorsByType", intervalMs, async () => {
      const r = await this.api.getPendingByErrorType();
      if (r.ok) this.pendingByErrorType = Array.isArray(r.value) ? r.value : [];
    });
    this._pollHandles = [k, b, e];
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
