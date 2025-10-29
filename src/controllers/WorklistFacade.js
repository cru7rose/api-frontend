// ============================================================================
// Frontend: Fix WorklistFacade import
// FILE: src/controllers/WorklistFacade.js (Supersedes previous version)
// REASON: Correct the case of the 'worklistStore' import to 'WorklistStore'
//         to match the filename, fixing the Docker build failure.
// ============================================================================
// FILE: src/controllers/WorklistFacade.js
import { useWorklistStore } from "@/stores/WorklistStore"; // *** CORRECTED FILE CASE ***
import { PollingService } from "@/services/PollingService";
import { Result } from "@/domain/Result";

export class WorklistFacade {
    constructor(polling = new PollingService()) {
        this._store = useWorklistStore();
        this.poll = polling;
        this._pollHandle = null;
    }

    async initAndLoad(filters = {}) {
        if (Object.keys(filters).length > 0) {
            this._store.filter = this._store.filter.withPatch(filters);
            this._store.pagination.currentPage = 1;
        }
        const result = await this._store.loadWorklistPage();
        return result.ok ? Result.ok(this.snapshot()) : Result.fail(result.error);
    }

    startPolling(intervalMs = 15000) {
        if (this._pollHandle) {
            this.stopPolling();
        }
        this._pollHandle = this.poll.start("worklist", intervalMs, async () => {
            // CORRECTED: Use the correct store action name 'loadWorklistPage'
            await this._store.loadWorklistPage();
        });
        // Removed console.log for production readiness
        return true;
    }

    stopPolling() {
        if (this._pollHandle) {
            this.poll.stop("worklist");
            this._pollHandle = null;
            // Removed console.log for production readiness
            return true;
        }
        return false;
    }

    snapshot() {
        return {
            filter: { ...this._store.filter },
            items: [...this._store.items],
            pagination: { ...this._store.pagination },
            loading: this._store.loading,
            error: this._store.error,
            selection: [...this._store.selection],
        };
    }

    async applyFilterPatch(patch) {
        return await this._store.applyFilterPatch(patch);
    }

    async resetFilter() {
        return await this._store.resetFilter();
    }

    async goToPage(pageNumber) {
        return await this._store.goToPage(pageNumber);
    }

    async changePageSize(size) {
        return await this._store.changePageSize(size);
    }

    toggleSelection(orderId) {
        this._store.toggleSelection(orderId);
    }

    clearSelection() {
        this._store.clearSelection();
    }

    getSelection() {
        return [...this._store.selection];
    }
}
