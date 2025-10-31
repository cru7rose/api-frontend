// ============================================================================
// Frontend: New Store
// FILE: src/stores/adminOrderStore.js (NEW FILE)
// REASON: Implements Request 2: State management for the new Order Admin view.
// REASON (UPDATE): Added reactive filters and logic to apply them.
// ============================================================================
import { defineStore } from 'pinia';
import apiClient from '@/services/api';
import { ref, reactive } from 'vue';
import { useToast } from '@/composables/useToast';

export const useAdminOrderStore = defineStore('adminOrder', () => {
    // --- State ---
    const orders = ref([]);
    const pagination = reactive({
        currentPage: 0, // 0-based for API
        itemsPerPage: 50,
        totalItems: 0,
        totalPages: 0,
    });
    const sort = reactive({
        field: 'lastUpdatedAt',
        direction: 'DESC',
    });
    // *** ADDED: Filters state ***
    const filters = reactive({
        barcode: '',
        source: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    });
    const loading = ref(false);
    const error = ref(null);
    const toast = useToast();

    // --- Actions ---
    async function fetchAllOrders() {
        loading.value = true;
        error.value = null;

        const params = new URLSearchParams({
            page: pagination.currentPage,
            size: pagination.itemsPerPage,
            sort: `${sort.field},${sort.direction}`,
        });

        // *** ADDED: Append filters to params ***
        if (filters.barcode) params.set('barcode', filters.barcode);
        if (filters.source) params.set('source', filters.source);
        if (filters.status) params.set('status', filters.status);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        // *** END ADDED ***

        try {
            const response = await apiClient.get(`/api/admin/orders/all?${params.toString()}`);
            const data = response.data;
            orders.value = data.content || [];
            pagination.totalItems = data.totalElements;
            pagination.totalPages = data.totalPages;
            pagination.currentPage = data.number; // Sync with response
        } catch (err) {
            console.error("Failed to fetch all orders:", err);
            error.value = err.response?.data?.error || err.message || "Failed to fetch all orders.";
            toast.error(error.value, 10000);
            orders.value = [];
        } finally {
            loading.value = false;
        }
    }

    async function changeOrderStatus(orderId, newStatus) {
        if (!orderId || !newStatus) {
            toast.error("Order ID and new status are required.");
            return;
        }
        loading.value = true;
        error.value = null;
        try {
            const response = await apiClient.post(`/api/admin/orders/${orderId}/status`, {
                newStatus: newStatus,
            });
            // Update the single order in the list
            const index = orders.value.findIndex(o => o.id === orderId);
            if (index !== -1) {
                // Update the item in place to maintain reactivity
                orders.value[index] = { ...orders.value[index], ...response.data };
            }

            toast.success(`Successfully updated status for order ${response.data.barcode} to ${newStatus}.`);
        } catch (err) {
            console.error(`Failed to update status for order ${orderId}:`, err);
            error.value = err.response?.data?.error || err.message || `Failed to update status for order ${orderId}.`;
            toast.error(error.value, 10000);
        } finally {
            loading.value = false;
        }
    }

    function setPage(pageNumber) {
        if (pageNumber >= 0 && pageNumber < (pagination.totalPages || 1) ) {
            pagination.currentPage = pageNumber;
            fetchAllOrders();
        }
    }

    function setSort(field) {
        if (sort.field === field) {
            sort.direction = sort.direction === 'ASC' ? 'DESC' : 'ASC';
        } else {
            sort.field = field;
            sort.direction = 'DESC';
        }
        pagination.currentPage = 0; // Reset to first page
        fetchAllOrders();
    }

    // *** ADDED: Filter actions ***
    function applyFilters() {
        pagination.currentPage = 0;
        fetchAllOrders();
    }

    function resetFilters() {
        filters.barcode = '';
        filters.source = '';
        filters.status = '';
        filters.dateFrom = '';
        filters.dateTo = '';
        applyFilters();
    }
    // *** END ADDED ***


    // --- Return Store ---
    return {
        orders,
        pagination,
        sort,
        filters, // Expose filters
        loading,
        error,
        fetchAllOrders,
        changeOrderStatus,
        setPage,
        setSort,
        applyFilters, // Expose action
        resetFilters, // Expose action
    };
});