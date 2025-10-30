// ============================================================================
// Frontend: Update LogService.js (Supersedes previous version)
// FILE: src/services/LogService.js
// REASON: FIX: Removed incorrect 'extends Api'.
//         Import 'apiClient' (default export) instead of named 'Api'.
//         Added constructor to set 'this.client'.
//         Added 'normalizeError' helper method (stubbed).
// ============================================================================
import apiClient from '@/services/Api.js'; // *** THIS IS THE FIX ***
import { Result } from '@/domain/Result';

export class LogService { // *** REMOVED 'extends Api' ***
    constructor() {
        // *** ADDED CONSTRUCTOR ***
        this.client = apiClient;
    }

    /**
     * Queries the aggregated log endpoint.
     * @param {object} filters - { query, correlationId, appName, level, startTime, endTime }
     * @param {object} pageable - { page, size, sort }
     * @returns {Promise<Result<object>>} A promise that resolves to a Page object.
     */
    async queryLogs(filters = {}, pageable = { page: 0, size: 50, sort: '@timestamp,desc' }) {
        const params = new URLSearchParams();

        // Add filters
        if (filters.query) params.append('query', filters.query);
        if (filters.correlationId) params.append('correlationId', filters.correlationId);
        if (filters.appName) params.append('appName', filters.appName);
        if (filters.level) params.append('level', filters.level);
        if (filters.startTime) params.append('startTime', filters.startTime);
        if (filters.endTime) params.append('endTime', filters.endTime);

        // Add pagination
        params.append('page', pageable.page);
        params.append('size', pageable.size);
        if (pageable.sort) {
            // Spring Boot expects sort=property,direction
            params.append('sort', pageable.sort);
        }

        try {
            const response = await this.client.get(`/api/admin/logs/query?${params.toString()}`);
            return Result.ok(response.data); // Returns the Page<Map<String, Object>>
        } catch (e) {
            const error = this.normalizeError(e, "Failed to query logs");
            return Result.fail(error);
        }
    }

    // *** ADDED HELPER (Stubbed) ***
    normalizeError(e, defaultMessage) {
        const error = e.response?.data?.error || e.response?.data?.message || e.message || defaultMessage;
        return new Error(error);
    }
    // *** END ADDED HELPER ***
}