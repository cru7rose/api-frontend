// ============================================================================
// Frontend: NEW FILE
// FILE: src/services/WorklistApi.js
// REASON: Fixes the critical build error "Could not load /app/src/services/WorklistApi.js".
//         This class wraps API calls for the worklist.
// ============================================================================
import apiClient from "@/services/Api.js";
import { Result } from "@/domain/Result";

/**
 * ARCHITECTURE: API client for worklist (OrdersShadow) operations.
 * Isolates transport logic for fetching paginated/filtered orders.
 */
export class WorklistApi {
    constructor() {
        this.client = apiClient;
    }

    /**
     * Fetches the worklist based on filters and pagination.
     * @param {object} filterValues - Plain object from WorklistFilter.toQueryRecord()
     * @param {object} pageRequest - { page, size, sort }
     * @returns {Promise<Result<object>>} A Result containing the paginated data.
     */
    async getWorklist(filterValues = {}, pageRequest = { page: 0, size: 25, sort: 'ingestedAt,desc' }) {
        try {
            const q = new URLSearchParams();

            // Add filters
            for (const [key, value] of Object.entries(filterValues)) {
                if (value) {
                    q.set(key, value);
                }
            }

            // Add pagination
            q.set("page", String(pageRequest.page >= 0 ? pageRequest.page : 0));
            q.set("size", String(pageRequest.size || 25));
            if (pageRequest.sort) {
                q.set("sort", pageRequest.sort);
            }

            // Corresponds to OrderController.getOrders
            const res = await this.client.get(`/api/orders?${q.toString()}`);
            const data = res.data || {};

            // Map to the structure expected by the old store (for compatibility)
            // or just return the Spring Page object.
            return Result.ok({
                content: Array.isArray(data.content) ? data.content : [],
                number: Number(data.number || 0),
                size: Number(data.size || 0),
                totalElements: Number(data.totalElements || 0),
                totalPages: Number(data.totalPages || 0),
            });
        } catch (e) {
            console.error("Error fetching worklist:", e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to fetch worklist.";
            return Result.fail(new Error(errorMessage));
        }
    }
}