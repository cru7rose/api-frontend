// src/services/AddressExceptionApi.js
/**
 * ARCHITECTURE: AddressExceptionApi encapsulates backend endpoints for worklist and editor operations.
 * It follows the manifesto by isolating transport, shaping payloads, and returning Result objects.
 * REFACTORED: Updated getOrderDetail to correctly map the backend OrderDetailDTO structure
 * (assuming fields like id, barcode, pickupAddress, deliveryAddress)
 * to the structure expected by the frontend CorrectionEditorController.
 */
import api from "@/services/api";
import { Result } from "@/domain/Result";
import { Address } from "@/domain/WorkbenchModels"; // Import frontend Address model

export class AddressExceptionApi {
    constructor() {
        // Base paths handled directly in endpoint calls
    }

    /**
     * Fetches a paginated list of orders needing review.
     * Maps backend Page<OrderSummaryDTO> to { items, total }.
     * @param {object} filter - Contains filter criteria (page, size, status, barcode, etc.)
     * @returns {Promise<Result<{items: Array, total: number}, Error>>}
     */
    async getWorklist(filter = { page: 1, size: 25, status: 'ADDRESS_NEEDS_REVIEW' }) {
        try {
            const q = new URLSearchParams();
            q.set("page", String(filter.page > 0 ? filter.page - 1 : 0)); // Spring Pageable is 0-indexed
            q.set("size", String(filter.size || 25));
            q.set("status", filter.status || 'ADDRESS_NEEDS_REVIEW'); // Default or specified status
            if (filter.barcode) q.set("barcode", filter.barcode);
            // Add other filters/sorting as needed based on backend capabilities
            // q.set("sort", `${filter.sortBy || 'createdAt'},${filter.sortDir || 'DESC'}`);

            const res = await api.get(`/api/orders?${q.toString()}`);
            const data = res.data || {};
            // Map Spring Page<OrderSummaryDTO> response
            return Result.ok({
                items: Array.isArray(data.content) ? data.content : [],
                total: Number(data.totalElements || 0),
            });
        } catch (e) {
            console.error("Error fetching worklist:", e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to fetch worklist.";
            return Result.fail(new Error(errorMessage));
        }
    }

    /**
     * Fetches the full details of a specific order by its UUID.
     * Assumes backend now returns OrderDetailDTO. Maps this DTO to the structure
     * expected by CorrectionEditorController (using frontend Address model).
     * @param {string} orderId - The UUID of the order.
     * @returns {Promise<Result<object, Error>>} Frontend OrderDetail structure.
     */
    async getOrderDetail(orderId) {
        if (!orderId) {
            return Result.fail(new Error("Order ID is required."));
        }
        try {
            const res = await api.get(`/api/orders/${encodeURIComponent(orderId)}`);
            const backendDto = res.data; // Assuming this is OrderDetailDTO

            if (!backendDto || !backendDto.id) {
                return Result.fail(new Error(`Order details not found or invalid response for ID: ${orderId}`));
            }

            // Map backend OrderDetailDTO to the frontend structure expected by CorrectionEditorController
            const frontendDetail = {
                orderId: backendDto.id, // Use 'id' from response
                barcode: backendDto.barcode,
                requestId: backendDto.requestId,
                customerId: backendDto.customerId,
                processingStatus: backendDto.processingStatus,
                createdAt: backendDto.createdAt,
                updatedAt: backendDto.updatedAt,
                // Map nested backend AddressDto to frontend Address model
                originalPickup: backendDto.pickupAddress ? Address.from(backendDto.pickupAddress) : new Address(),
                originalDelivery: backendDto.deliveryAddress ? Address.from(backendDto.deliveryAddress) : new Address(),
                // Assume suggestions are still fetched separately or now included in DTO
                suggestedPickup: Array.isArray(backendDto.suggestedPickup) ? backendDto.suggestedPickup : [],
                suggestedDelivery: Array.isArray(backendDto.suggestedDelivery) ? backendDto.suggestedDelivery : [],
                relatedError: backendDto.relatedError || null // Pass through if present
            };
            return Result.ok(frontendDetail);
        } catch (e) {
            console.error(`Error fetching order detail for ${orderId}:`, e);
            const status = e.response?.status;
            const errorMessage = e.response?.data?.error || e.message || `Failed to fetch order details for ID: ${orderId}.`;
            if (status === 404) {
                return Result.fail(new Error(`Order not found: ${orderId}`));
            }
            return Result.fail(new Error(errorMessage));
        }
    }

    /**
     * Saves the corrected address details back to the backend.
     * @param {object} body - The CorrectionRequest payload (orderId, side, correctedPickup?, correctedDelivery?, resolution).
     * @param {string|null} idempotencyToken - Optional token for preventing duplicate saves.
     * @returns {Promise<Result<any, Error>>} Backend response data or true on success.
     */
    async saveCorrection(body, idempotencyToken = null) {
        try {
            const orderId = body?.orderId;
            if (!orderId) {
                return Result.fail(new Error("Missing orderId in saveCorrection payload"));
            }
            // Ensure address objects are plain objects if needed by backend
            const payload = {
                ...body,
                correctedPickup: body.correctedPickup?.toPlain ? body.correctedPickup.toPlain() : body.correctedPickup,
                correctedDelivery: body.correctedDelivery?.toPlain ? body.correctedDelivery.toPlain() : body.correctedDelivery
            };

            const headers = idempotencyToken ? { "Idempotency-Key": idempotencyToken } : {};
            const res = await api.post(`/api/orders/${encodeURIComponent(orderId)}/corrections`, payload, { headers });
            return Result.ok(res.data || true); // Return response data or true
        } catch (e) {
            console.error(`Error saving correction for order ${body?.orderId}:`, e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to save correction.";
            return Result.fail(new Error(errorMessage));
        }
    }

    // --- Other methods (e.g., bulk, getNextOrderId, kpis) remain as placeholders or need specific backend confirmation ---
    // async refreshSuggestions(orderId, side) { /* ... likely handled by error store/service ... */ }
    // async bulkPreview(plan) { /* ... needs backend endpoint confirmation ... */ }
    // async bulkApply(plan) { /* ... needs backend endpoint confirmation ... */ }
    // async getNextOrderId(currentId, filter) { /* ... likely handled by queue service + getWorklist ... */ }
    // async getTriageKpis() { /* ... needs backend endpoint confirmation ... */ }
    // async getRecentBatches() { /* ... needs backend endpoint confirmation ... */ }
    // async getPendingByErrorType() { /* ... needs backend endpoint confirmation ... */ }
}