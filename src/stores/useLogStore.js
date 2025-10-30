// FILE: src/stores/useLogStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/services/Api.js';
import { useAuthStore } from '@/stores/authStore.js';

export const useLogStore = defineStore('logStore', () => {
    const logs = ref([]);
    const totalElements = ref(0);
    const totalPages = ref(0);
    const currentPage = ref(0);
    const loading = ref(false);
    const error = ref(null);

    const queryFilter = ref('');
    const correlationIdFilter = ref('');
    const appNameFilter = ref('');
    const levelFilter = ref('');
    const startTimeFilter = ref('');
    const endTimeFilter = ref('');
    const pageable = ref({
        page: 0,
        size: 50,
        sort: '@timestamp,desc'
    });

    async function fetchLogs() {
        if (loading.value) return;
        loading.value = true;
        error.value = null;

        const params = new URLSearchParams({
            page: pageable.value.page,
            size: pageable.value.size,
            sort: pageable.value.sort,
        });
        if (queryFilter.value) params.set('query', queryFilter.value);
        if (correlationIdFilter.value) params.set('correlationId', correlationIdFilter.value);
        if (appNameFilter.value) params.set('appName', appNameFilter.value);
        if (levelFilter.value) params.set('level', levelFilter.value);
        if (startTimeFilter.value) params.set('startTime', startTimeFilter.value);
        if (endTimeFilter.value) params.set('endTime', endTimeFilter.value);

        try {
            // *** FIX: Added /api prefix ***
            const response = await apiClient.get(`/api/admin/logs/query?${params.toString()}`);
            // *** END FIX ***
            const data = response.data || {};

            if (data && data.content) {
                logs.value = data.content;
                totalElements.value = data.totalElements;
                totalPages.value = data.totalPages;
                currentPage.value = data.number;
            } else {
                // Fallback for potential direct response without 'data' wrapper if API changes
                if (response && response.content) {
                    logs.value = response.content;
                    totalElements.value = response.totalElements;
                    totalPages.value = response.totalPages;
                    currentPage.value = response.number;
                } else {
                    throw new Error("Invalid response format received from log query API.");
                }
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
            // Check for 404 specifically if needed
            if (err.response?.status === 404) {
                error.value = 'Log query endpoint not found. Please check the API path.';
            } else {
                error.value = err.message || 'Failed to fetch logs.';
            }
            logs.value = [];
            totalElements.value = 0;
            totalPages.value = 0;
            currentPage.value = 0;
        } finally {
            loading.value = false;
        }
    }

    function setPage(pageNumber) {
        if (pageNumber >= 0 && pageNumber < (totalPages.value || 1) ) {
            pageable.value.page = pageNumber;
            fetchLogs();
        }
    }

    function applyFiltersAndFetch() {
        pageable.value.page = 0; // Reset to first page on filter change
        fetchLogs();
    }

    // Initial fetch can be triggered here or from the component
    // fetchLogs();

    return {
        logs, totalElements, totalPages, currentPage, loading, error,
        queryFilter, correlationIdFilter, appNameFilter, levelFilter,
        startTimeFilter, endTimeFilter, pageable,
        fetchLogs, setPage, applyFiltersAndFetch,
    };
});