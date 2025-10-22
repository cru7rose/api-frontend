/**
 * ARCHITECTURE: WorklistFacade provides a simplified interface for initializing
 * and controlling the polling of the worklist, interacting with the Pinia store.
 * It's primarily used for bootstrapping and managing background updates.
 * Direct state access and most actions should be done via `useWorklistStore` in components.
 */
import { useWorklistStore } from "@/stores/worklistStore";
import { PollingService } from "@/services/PollingService";
import { Result } from "@/domain/Result";

export class WorklistFacade {
    constructor(polling = new PollingService()) {
        // Get the store instance - assumes Pinia is initialized.
        this._store = useWorklistStore();
        this.poll = polling;
        this._pollHandle = null;
    }

    /**
     * Initializes the store by loading the first page based on optional filters.
     * @param {object} filters - Initial filter settings.
     * @returns {Promise<Result<object, Error>>} Result with initial snapshot or error.
     */
    async initAndLoad(filters = {}) {
        // Apply initial filters directly via store action if needed
        if (Object.keys(filters).length > 0) {
            this._store.filter = this._store.filter.withPatch(filters);
            this._store.pagination.currentPage = 1;
        }
        const result = await this._store.loadPage();
        // Return snapshot or error based on the load result
        return result.ok ? Result.ok(this.snapshot()) : Result.fail(result.error);
    }

    /**
     * Starts polling the worklist store's loadPage action.
     * @param {number} intervalMs - Polling interval in milliseconds.
     * @returns {boolean} True if polling was started.
     */
    startPolling(intervalMs = 15000) {
        if (this._pollHandle) {
            this.stopPolling();
        }
        this._pollHandle = this.poll.start("worklist", intervalMs, async () => {
            // Poll by calling the store's action
            await this._store.loadPage();
        });
        console.log(`[WorklistFacade] Started polling worklist every ${intervalMs}ms.`);
        return true;
    }

    /**
     * Stops the worklist polling loop.
     * @returns {boolean} True if polling was stopped.
     */
    stopPolling() {
        if (this._pollHandle) {
            this.poll.stop("worklist");
            this._pollHandle = null;
            console.log("[WorklistFacade] Stopped polling worklist.");
            return true;
        }
        return false;
    }

    /**
     * Provides a snapshot of the current worklist state from the Pinia store.
     * Primarily for non-Vue contexts; components should use the store directly.
     * @returns {object} Snapshot of store state.
     */
    snapshot() {
        // Create a snapshot directly from store state
        return {
            filter: { ...this._store.filter },
            items: [...this._store.items],
            pagination: { ...this._store.pagination },
            loading: this._store.loading,
            error: this._store.error,
            selection: [...this._store.selection],
        };
    }

    // Facade actions delegate directly to the store actions for convenience
    // Consumers can also call store actions directly via useWorklistStore().

    /** Apply filter patch and reload */
    async applyFilterPatch(patch) {
        return await this._store.applyFilterPatch(patch);
    }
    /** Reset filters and reload */
    async resetFilter() {
        return await this._store.resetFilter();
    }
    /** Go to a specific page */
    async goToPage(pageNumber) {
        return await this._store.goToPage(pageNumber);
    }
    /** Change items per page */
    async changePageSize(size) {
        return await this._store.changePageSize(size);
    }
    /** Toggle item selection */
    toggleSelection(orderId) {
        this._store.toggleSelection(orderId);
    }
    /** Clear selection */
    clearSelection() {
        this._store.clearSelection();
    }
    /** Get selected IDs */
    getSelection() {
        // Return a copy to prevent mutation outside store
        return [...this._store.selection];
    }
}