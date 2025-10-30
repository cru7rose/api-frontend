// ============================================================================
// Frontend ➜ stores/useAedSftpStore.js (NEW FILE)
// ARCHITECTURE: Pinia store for the new AED SFTP Admin view.
// ============================================================================
import { defineStore } from 'pinia';
import apiClient from '@/services/Api.js'; // Use the Shared API client
import { ref } from 'vue';

export const useAedSftpStore = defineStore('aedSftpAdmin', () => {
    const isLoading = ref(false);
    const error = ref(null);
    const successMessage = ref(null);
    const lastExportCount = ref(0);

    // Get current time minus 1 month as default
    const getDefaultStartTime = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        // Format as YYYY-MM-DDTHH:MM:SS
        return d.toISOString().substring(0, 19);
    };

    const startTime = ref(getDefaultStartTime());

    async function triggerManualExport() {
        isLoading.value = true;
        error.value = null;
        successMessage.value = null;
        lastExportCount.value = 0;

        if (!startTime.value) {
            error.value = "Start time is required.";
            isLoading.value = false;
            return;
        }

        try {
            const params = new URLSearchParams({
                startTime: startTime.value
            });

            const response = await apiClient.post(`/api/admin/aed/outbound/export-from?${params.toString()}`);

            lastExportCount.value = response.data?.exportedCount || 0;
            successMessage.value = `Successfully exported ${lastExportCount.value} 'MG' status(es) recorded since ${startTime.value}.`;

        } catch (err) {
            console.error("Failed to trigger manual AED export:", err);
            error.value = err.response?.data?.error || err.message || "Failed to trigger export.";
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        error,
        successMessage,
        lastExportCount,
        startTime,
        triggerManualExport
    };
});