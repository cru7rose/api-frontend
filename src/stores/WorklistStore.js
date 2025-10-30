// ============================================================================
// Frontend: Add WorklistStore.js
// FILE: src/stores/WorklistStore.js (NEW FILE)
// REASON: This file was missing, causing the build to fail.
//         It manages the state of the main worklist.
// ============================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Result } from '@/domain/Result';
import { WorklistApi } from '@/services/WorklistApi';

export const useWorklistStore = defineStore('worklist', () => {
    // --- State ---
    const items = ref([]); // Holds the current page of items
    const loading = ref(false);
    const error = ref(null);
    const pagination = ref({
        page: 1,
        size: 25,
        totalElements: 0,
        totalPages: 1,
    });
    const filters = ref({
        barcode: '',
        status: 'PENDING_VERIFICATION', // Default to pending
    });

    const api = new WorklistApi();

    // --- Getters ---
    const worklist = computed(() => items.value);

    // --- Actions ---

    async function loadWorklist() {
        loading.value = true;
        error.value = null;

        const pageRequest = {
            page: pagination.value.page - 1, // API is 0-indexed
            size: pagination.value.size,
            sort: 'ingestedAt,desc', // Default sort
        };

        const filterValues = {
            barcode: filters.value.barcode || null,
            status: filters.value.status || null,
        };

        const result = await api.getWorklist(filterValues, pageRequest);

        if (result.ok) {
            const data = result.value;
            items.value = data.content;
            pagination.value = {
                page: data.number + 1, // UI is 1-indexed
                size: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages,
            };
        } else {
            error.value = result.error.message;
            items.value = [];
        }
        loading.value = false;
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters };
        pagination.value.page = 1; // Reset to first page on filter change
        loadWorklist();
    }

    function setPage(pageNumber) {
        if (pageNumber > 0 && pageNumber <= pagination.value.totalPages) {
            pagination.value.page = pageNumber;
            loadWorklist();
        }
    }

    // --- Methods for "Save and Next" ---

    /**
     * Removes an item from the local list (after save).
     * @param {string} orderId - The UUID of the order to remove.
     */
    function removeItem(orderId) {
        const index = items.value.findIndex(item => item.id === orderId);
        if (index > -1) {
            items.value.splice(index, 1);
            pagination.value.totalElements = Math.max(0, pagination.value.totalElements - 1);
        }
    }

    /**
     * Finds the next item in the list after the current one.
     * @param {string} currentOrderId - The UUID of the just-saved order.
     * @returns {string | null} The ID of the next order, or null if none.
     */
    function getNextItem(currentOrderId) {
        if (!items.value || items.value.length === 0) {
            // List is now empty, no next item
            return null;
        }
        // The list has already had the item removed, so the "next"
        // item is just the one at the current index (which is now the next item).
        // We just return the first item in the remaining list.
        return items.value[0].id;
    }

    return {
        items,
        loading,
        error,
        pagination,
        filters,
        worklist,
        loadWorklist,
        setFilters,
        setPage,
        removeItem,
        getNextItem,
    };
});