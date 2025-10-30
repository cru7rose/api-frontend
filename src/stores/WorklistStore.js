// ============================================================================
// Frontend: Update WorklistStore.js (Supersedes previous version)
// FILE: src/stores/WorklistStore.js
// REASON: Fix build error by importing new WorklistApi.
//         Implement WorklistFilter domain object correctly.
//         Add missing selection and pagination logic.
// ============================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Result } from '@/domain/Result';
import { WorklistApi } from '@/services/WorklistApi.js'; // <-- FIX: Import new API
import { WorklistFilter } from '@/domain/WorklistFilter.js'; // <-- FIX: Import domain object

export const useWorklistStore = defineStore('worklist', () => {
    // --- State ---
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const pagination = ref({
        page: 1, // UI is 1-indexed
        size: 25,
        totalElements: 0,
        totalPages: 1,
    });
    // --- FIX: Use the WorklistFilter domain object ---
    const filters = ref(new WorklistFilter({
        status: 'PENDING_VERIFICATION', // Default to pending
    }));
    // --- FIX: Add selection state ---
    const selection = ref([]);

    const api = new WorklistApi();

    // --- Getters ---
    const worklist = computed(() => items.value);
    // --- FIX: Add selection getters ---
    const selectedCount = computed(() => selection.value.length);
    const isSelected = computed(() => (orderId) => selection.value.includes(orderId));

    // --- Actions ---

    async function loadWorklist() {
        loading.value = true;
        error.value = null;

        const pageRequest = {
            page: pagination.value.page - 1, // API is 0-indexed
            size: pagination.value.size,
            sort: 'ingestedAt,desc', // Default sort
        };

        // --- FIX: Use the filter domain object ---
        const filterValues = filters.value.toQueryRecord();

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
            // Clear selection on page load
            clearSelection();
        } else {
            error.value = result.error.message;
            items.value = [];
        }
        loading.value = false;
    }

    // --- FIX: Updated filter/page actions ---
    function setFilters(newFilters) {
        filters.value = filters.value.withPatch(newFilters);
        pagination.value.page = 1; // Reset to first page on filter change
        loadWorklist();
    }

    function handleResetFilter() {
        filters.value = new WorklistFilter(); // Reset to default
        pagination.value.page = 1;
        loadWorklist();
    }

    function setPage(pageNumber) {
        if (pageNumber > 0 && pageNumber <= (pagination.value.totalPages || 1)) {
            pagination.value.page = pageNumber;
            loadWorklist();
        }
    }

    function setPageSize(size) {
        pagination.value.size = size;
        pagination.value.page = 1; // Reset to first page
        loadWorklist();
    }

    // --- FIX: Add selection actions ---
    function toggleSelection(orderId) {
        const index = selection.value.indexOf(orderId);
        if (index > -1) {
            selection.value.splice(index, 1);
        } else {
            selection.value.push(orderId);
        }
    }

    function clearSelection() {
        selection.value = [];
    }

    function selectAllOnPage() {
        // Select all items *currently* visible on the page
        selection.value = items.value.map(item => item.id);
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
        // Also remove from selection
        const selIndex = selection.value.indexOf(orderId);
        if (selIndex > -1) {
            selection.value.splice(selIndex, 1);
        }
    }

    /**
     * Finds the next item in the list after the current one.
     * @param {string} currentOrderId - The UUID of the just-saved order.
     * @returns {string | null} The ID of the next order, or null if none.
     */
    function getNextItem(currentOrderId) {
        // The list has already had 'currentOrderId' removed by removeItem.
        // The "next" item is simply the first one remaining in the list.
        if (!items.value || items.value.length === 0) {
            // List is now empty, check if we can go to the next page
            if (pagination.value.page < pagination.value.totalPages) {
                // This is tricky. We'll just signal "no more items" for now.
                // A better implementation might auto-load the next page.
                return null;
            }
            return null;
        }
        return items.value[0].id;
    }

    return {
        items,
        loading,
        error,
        pagination,
        filters, // Expose the reactive filter object
        selection, // Expose selection
        worklist,
        selectedCount,
        isSelected,
        loadWorklist,
        setFilters,
        handleResetFilter,
        setPage,
        setPageSize,
        toggleSelection,
        clearSelection,
        selectAllOnPage,
        removeItem,
        getNextItem,
    };
});