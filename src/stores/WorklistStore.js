// ============================================================================
// Frontend: Update WorklistStore (Supersedes previous version)
// FILE: src/stores/WorklistStore.js
// REASON: Align default status with new "ALL_ACTIONABLE" logic.
// ============================================================================
// FILE: src/stores/WorklistStore.js (Supersedes previous version)

import { defineStore } from 'pinia';
import { WorklistFilter } from "@/domain/WorklistFilter";
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
/**
 * ARCHITECTURE: Pinia store for managing the state of the Address Exception Worklist.
 * REFACTORED: Default filter status set to ALL_ACTIONABLE.
 */
export const useWorklistStore = defineStore('worklist', {
    state: () => ({
        // *** MODIFIED: Use ALL_ACTIONABLE ***
        filter: new WorklistFilter({
            status: 'ALL_ACTIONABLE',
            barcode: '',
            customerId: '',
            dateFrom: '', // YYYY-MM-DD
            dateTo: '',   // YYYY-MM-DD
        }), // Use domain object for filter state
        items: [], // Array of OrderSummaryDTO { id, barcode, customerId, processingStatus, createdAt, updatedAt, sourceSystem }
        pagination: {
            currentPage: 1, // Use 1-based indexing for UI
            itemsPerPage: 25,
            totalItems: 0,
            totalPages: 0,
        },
        selection: [], // Array of selected order IDs (UUIDs)
        loading: false,
        error: null, // Stores error message string or Error object
    }),
    getters: {
        isSelected: (state) => (orderId) => {
            return state.selection.includes(orderId);
        },
        currentFilter: (state) => {
            return state.filter.toPlainObject ?
                state.filter.toPlainObject() : { ...state.filter };
        },
        currentPageInfo: (state) => {
            return { ...state.pagination };
        },
        selectedCount: (state) => {
            return state.selection.length;
        }
    },
    actions: {
        _getApi() {
            return new AddressExceptionApi();
        },

        async loadWorklistPage() {
            this.loading = true;
            this.error = null;
            this.clearSelection();
            const api = this._getApi();
            try {
                const filterParams = {
                    ...(this.filter.toQueryRecord ? this.filter.toQueryRecord() : this.filter),
                    page: this.pagination.currentPage > 0 ?
                        this.pagination.currentPage - 1 : 0,
                    size: this.pagination.itemsPerPage,
                };
                Object.keys(filterParams).forEach(key => (filterParams[key] == null || filterParams[key] === '') && delete filterParams[key]);
                const result = await api.getWorklist(filterParams);
                if (result.ok) {
                    this.items = result.value.items || [];
                    this.pagination.totalItems = result.value.total || 0;
                    this.pagination.totalPages = this.pagination.itemsPerPage > 0
                        ?
                        Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage) || 1
                        : 1;
                    if (this.pagination.currentPage > this.pagination.totalPages) {
                        this.pagination.currentPage = this.pagination.totalPages;
                    }
                    return Result.ok();
                } else {
                    throw result.error;
                }
            } catch (err) {
                console.error("Failed to load worklist page:", err);
                this.error = err.message || "Failed to load worklist.";
                this.items = [];
                this.pagination.totalItems = 0;
                this.pagination.totalPages = 1;
                this.pagination.currentPage = 1;
                return Result.fail(err);
            } finally {
                this.loading = false;
            }
        },

        async applyFilterPatch(patch) {
            this.pagination.currentPage = 1;
            this.filter = this.filter.withPatch(patch || {});
            await this.loadWorklistPage();
        },

        async resetFilter() {
            // *** MODIFIED: Use ALL_ACTIONABLE ***
            this.filter = new WorklistFilter({
                status: 'ALL_ACTIONABLE',
                barcode: '',
                customerId: '',
                dateFrom: '',
                dateTo: '',
            });
            this.pagination.currentPage = 1;
            await this.loadWorklistPage();
        },

        async goToPage(pageNumber) {
            const newPage = Math.max(1, Math.min(pageNumber, this.pagination.totalPages || 1));
            if (newPage !== this.pagination.currentPage) {
                this.pagination.currentPage = newPage;
                await this.loadWorklistPage();
            }
        },

        async changePageSize(size) {
            const newSize = Math.max(5, size);
            if (newSize !== this.pagination.itemsPerPage) {
                this.pagination.itemsPerPage = newSize;
                this.pagination.currentPage = 1;
                await this.loadWorklistPage();
            }
        },

        // --- Selection Actions ---
        toggleSelection(orderId) {
            const index = this.selection.indexOf(orderId);
            if (index > -1) {
                this.selection.splice(index, 1);
            } else {
                this.selection.push(orderId);
            }
        },
        setSelection(orderIds) {
            if (Array.isArray(orderIds)) {
                this.selection = [...new Set(orderIds)];
            }
        },
        clearSelection() {
            this.selection = [];
        },
        selectAllOnPage() {
            this.selection = this.items.map(item => item.id);
        },
    },
});