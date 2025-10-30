// ============================================================================
// Frontend: Fix WorklistFacade (Supersedes previous version)
// FILE: src/controllers/WorklistFacade.js
// REASON: Correct the import case of 'WorklistStore'.
//         Align method calls (e.g., loadWorklistPage -> loadWorklist)
//         with the fixed WorklistStore.
// ============================================================================
import { useWorklistStore } from "@/stores/WorklistStore.js"; // *** CORRECTED FILE CASE ***
import { PollingService } from "@/services/PollingService.js";
import { Result } from "@/domain/Result";

export class WorklistFacade {
    constructor(polling = new PollingService()) {
        this._store = useWorklistStore();
        this.poll = polling;
        this._pollHandle = null;
    }

    async initAndLoad(filters = {}) {
        // *** FIX: Call correct store method ***
        if (Object.keys(filters).length > 0) {
            this._store.setFilters(filters); // This will reset page and load
        } else {
            await this._store.loadWorklist();
        }
        // *** END FIX ***

        return this._store.error ?
            Result.fail(new Error(this._store.error)) :
            Result.ok(this.snapshot());
    }

    startPolling(intervalMs = 15000) {
        if (this._pollHandle) {
            this.stopPolling();
        }
        this._pollHandle = this.poll.start("worklist", intervalMs, async () => {
            // *** FIX: Call correct store method ***
            await this._store.loadWorklist();
        });
        return true;
    }

    stopPolling() {
        if (this._pollHandle) {
            this.poll.stop("worklist");
            this._pollHandle = null;
            return true;
        }
        return false;
    }

    snapshot() {
        return {
            // *** FIX: Use correct store state/getters ***
            filter: { ...this._store.filters.toPlainObject() },
            items: [...this._store.items],
            pagination: { ...this._store.pagination },
            loading: this._store.loading,
            error: this._store.error,
            selection: [...this._store.selection],
            // *** END FIX ***
        };
    }

    async applyFilterPatch(patch) {
        // *** FIX: Call correct store method ***
        await this._store.setFilters(patch);
        return this.snapshot();
    }

    async resetFilter() {
        // *** FIX: Call correct store method ***
        await this._store.handleResetFilter();
        return this.snapshot();
    }

    async goToPage(pageNumber) {
        // *** FIX: Call correct store method ***
        await this._store.setPage(pageNumber);
        return this.snapshot();
    }

    async changePageSize(size) {
        // *** FIX: Call correct store method ***
        await this._store.setPageSize(size);
        return this.snapshot();
    }

    toggleSelection(orderId) {
        // *** FIX: Call correct store method ***
        this._store.toggleSelection(orderId);
    }

    clearSelection() {
        // *** FIX: Call correct store method ***
        this._store.clearSelection();
    }

    getSelection() {
        // *** FIX: Read from state ***
        return [...this._store.selection];
    }
}