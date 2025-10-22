import { defineStore } from 'pinia';
import { WorklistFilter } from "@/domain/WorklistFilter";
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
// REMOVED: import { OrdersQueueService } from "@/services/OrdersQueueService"; // Queue logic decoupled

/**
 * ARCHITECTURE: Pinia store for managing the state of the Address Exception Worklist.
 * Encapsulates filters, pagination, items, selection, loading/error state,
 * and actions for interacting with the backend API (AddressExceptionApi).
 * Provides getters for derived state and actions for mutations and async operations.
 */
export const useWorklistStore = defineStore('worklist', {
    state: () => ({
        filter: new WorklistFilter(), // Use domain object for filter state
        items: [],
        pagination: {
            currentPage: 1, // Use 1-based indexing for UI
            itemsPerPage: 25,
            totalItems: 0,
            totalPages: 0,
        },
        selection: [], // Array of selected order IDs
        loading: false,
        error: null, // Stores error message string or Error object
    }),
    getters: {
        /** Checks if a specific order ID is currently selected. */
        isSelected: (state) => (orderId) => {
            return state.selection.includes(orderId);
        },
        /** Returns the current filter object. */
        currentFilter: (state) => {
            // Return a defensive copy if modification outside store is a concern
            return { ...state.filter };
        },
        /** Returns current pagination info. */
        currentPageInfo: (state) => {
            return { ...state.pagination };
        },
        /** Returns the count of selected items. */
        selectedCount: (state) => {
            return state.selection.length;
        }
    },
    actions: {
        // Internal helper to get API instance
        _getApi() {
            // In real app, manage API client instance appropriately (e.g., singleton)
            return new AddressExceptionApi();
        },

        /**
         * Loads a page of worklist items based on the current filter and pagination state.
         * Updates items, pagination, loading, and error state. Automatically clears selection.
         * @returns {Promise<Result<void, Error>>} Result indicating success or failure.
         */
        async loadPage() {
            this.loading = true;
            this.error = null;
            // Clear selection when loading/reloading data
            this.clearSelection();
            const api = this._getApi();
            try {
                // Prepare parameters for the backend API call
                const filterParams = {
                    ...this.filter.toQueryRecord(), // Convert filter object to query params
                    // Convert UI page (1-based) to backend page (0-based)
                    page: this.pagination.currentPage > 0 ? this.pagination.currentPage - 1 : 0,
                    size: this.pagination.itemsPerPage,
                    // Ensure status is always passed, default if not in filter
                    status: this.filter.status || 'ADDRESS_NEEDS_REVIEW'
                };
                // Remove null/undefined values from params if backend expects clean query
                Object.keys(filterParams).forEach(key => (filterParams[key] == null || filterParams[key] === '') && delete filterParams[key]);


                const result = await api.getWorklist(filterParams);

                if (result.ok) {
                    this.items = result.value.items || [];
                    this.pagination.totalItems = result.value.total || 0;
                    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage) || 1; // Ensure at least 1 page
                    // Ensure current page is valid after reload
                    if (this.pagination.currentPage > this.pagination.totalPages) {
                        this.pagination.currentPage = this.pagination.totalPages;
                    }
                    return Result.ok();
                } else {
                    throw result.error; // Throw error from Result.fail
                }
            } catch (err) {
                console.error("Failed to load worklist page:", err);
                this.error = err.message || "Failed to load worklist."; // Store error message
                this.items = []; // Clear items on error
                this.pagination.totalItems = 0;
                this.pagination.totalPages = 1;
                this.pagination.currentPage = 1; // Reset page on error
                return Result.fail(err);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Updates the filter state with a patch and reloads the first page.
         * @param {object} patch - Partial filter object (e.g., { barcode: '123' }).
         */
        async applyFilterPatch(patch) {
            this.pagination.currentPage = 1; // Reset to page 1 on filter change
            this.filter = this.filter.withPatch(patch || {}); // Ensure patch is applied safely
            await this.loadPage(); // Reload data
        },

        /**
         * Resets the filter to defaults and reloads the first page.
         */
        async resetFilter() {
            this.filter = new WorklistFilter(); // Create new default filter
            this.pagination.currentPage = 1;
            await this.loadPage();
        },

        /**
         * Navigates to a specific page number and reloads data.
         * @param {number} pageNumber - The 1-based page number.
         */
        async goToPage(pageNumber) {
            const newPage = Math.max(1, Math.min(pageNumber, this.pagination.totalPages || 1));
            if (newPage !== this.pagination.currentPage) {
                this.pagination.currentPage = newPage;
                await this.loadPage();
            }
        },

        /**
         * Changes the number of items per page and reloads the first page.
         * @param {number} size - The new page size.
         */
        async changePageSize(size) {
            const newSize = Math.max(5, size); // Min size 5
            if (newSize !== this.pagination.itemsPerPage) {
                this.pagination.itemsPerPage = newSize;
                this.pagination.currentPage = 1; // Reset to page 1
                await this.loadPage();
            }
        },

        // --- Selection Actions ---
        /** Toggles the selection state of a single order ID. */
        toggleSelection(orderId) {
            const index = this.selection.indexOf(orderId);
            if (index > -1) {
                this.selection.splice(index, 1);
            } else {
                this.selection.push(orderId);
            }
        },
        /** Sets the selection to the provided array of order IDs. */
        setSelection(orderIds) {
            if (Array.isArray(orderIds)) {
                // Ensure unique IDs if needed
                this.selection = [...new Set(orderIds)];
            }
        },
        /** Clears the current selection. */
        clearSelection() {
            this.selection = [];
        },
        /** Selects all items currently loaded on the page. */
        selectAllOnPage() {
            this.selection = this.items.map(item => item.orderId);
        },

        // --- Bulk Actions (Placeholders) ---
        // async bulkPreview(plan) { /* ... */ },
        // async bulkApply(plan) { /* ... */ },
    },
});