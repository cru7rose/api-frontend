// ============================================================================
// Frontend: Update AddressExceptionApi (Supersedes previous version)
// FILE: src/services/AddressExceptionApi.js
// REASON: Add 'saveResubmission' method for new save flow.
//         Update _getStoredAddressLabel to show raw reason codes.
// REFACTORED: Renamed 'saveResubmission' to 'saveApproval' and pointed it to the
//             correct backend endpoint (/api/orders/{barcode}/approve) to fix the save logic.
// ============================================================================
import api from "@/services/api";
import { Result } from "@/domain/Result";
import { Address } from "@/domain/WorkbenchModels";

/**
 * ARCHITECTURE: API client for address-related operations.
 * UPDATED: 'saveResubmission' is now 'saveApproval' and targets the correct endpoint.
 * UPDATED: _getStoredAddressLabel now returns the raw reason code.
 */
export class AddressExceptionApi {
    constructor() {
        this.client = api;
    }

    async getWorklist(filter = { page: 0, size: 25, status: 'PENDING_VERIFICATION' }) {
        try {
            const q = new URLSearchParams();
            q.set("page", String(filter.page >= 0 ? filter.page : 0));
            q.set("size", String(filter.size || 25));
            q.set("status", filter.status || 'PENDING_VERIFICATION');
            if (filter.barcode) q.set("barcode", filter.barcode);
            if (filter.sort) q.set("sort", filter.sort);
            if (filter.customerId) q.set("customerId", filter.customerId);
            if (filter.dateFrom) q.set("dateFrom", filter.dateFrom);
            if (filter.dateTo) q.set("dateTo", filter.dateTo);
            const res = await this.client.get(`/api/orders?${q.toString()}`);
            const data = res.data || {};
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

    async getOrderDetail(orderId) {
        if (!orderId) {
            return Result.fail(new Error("Order ID is required."));
        }
        try {
            const res = await this.client.get(`/api/orders/${encodeURIComponent(orderId)}`);
            const backendDto = res.data;
            if (!backendDto || !backendDto.id) {
                return Result.fail(new Error(`Order details not found or invalid response for ID: ${orderId}`));
            }

            // --- Map Original Addresses from OrderEvent (now includes alias/name) ---
            const originalEvent = this._safeParseJson(backendDto.originalOrderEventJson);
            const originalPickup = Address.from({
                ...backendDto.pickupAddress, // Contains street, houseNo, postal, city, lat, lon
                alias: originalEvent?.pickUpAlias || backendDto.pickupAlias, // Get alias from event
                name: originalEvent?.pickUpName || null // Get name from event
            });
            const originalDelivery = Address.from({
                ...backendDto.deliveryAddress,
                alias: originalEvent?.deliveryAlias || backendDto.deliveryAlias,
                name: originalEvent?.deliveryName || null
            });
// --- Map Stored Addresses (if they exist) ---
            const pickupStoredDisplay = backendDto.pickupStoredAddress ?
                Address.from(backendDto.pickupStoredAddress) : null;
            const deliveryStoredDisplay = backendDto.deliveryStoredAddress ? Address.from(backendDto.deliveryStoredAddress) : null;
// --- *** FIX: Show raw reason code *** ---
            const pickupStoredLabel = this._getStoredAddressLabel(backendDto.pickupReasonCode, 'Pickup');
            const deliveryStoredLabel = this._getStoredAddressLabel(backendDto.deliveryReasonCode, 'Delivery');
            // --- *** END FIX *** ---

            const frontendDetail = {
                orderId: backendDto.id,
                barcode: backendDto.barcode,
                requestId: backendDto.requestId,
                customerId: backendDto.customerId,

                sourceSystem: backendDto.sourceSystem,
                processingStatus: backendDto.processingStatus,
                createdAt: backendDto.createdAt,
                updatedAt: backendDto.updatedAt,

                // --- Use the newly constructed original addresses ---

                originalPickup: originalPickup,
                originalDelivery: originalDelivery,

                pickupReasonCode: backendDto.pickupReasonCode ||
                    null,
                deliveryReasonCode: backendDto.deliveryReasonCode ||
                    null,

                pickupStoredAddress: pickupStoredDisplay,
                deliveryStoredAddress: deliveryStoredDisplay,

                pickupStoredLabel: pickupStoredLabel,
                deliveryStoredLabel: deliveryStoredLabel,

                suggestedPickup: Array.isArray(backendDto.suggestedPickup) ?
                    backendDto.suggestedPickup : [],
                suggestedDelivery: Array.isArray(backendDto.suggestedDelivery) ?
                    backendDto.suggestedDelivery : [],

                // --- Pass original event JSON for resubmission ---
                originalOrderEventJson: backendDto.originalOrderEventJson ||
                    null,

                // Find the associated errorEventId (if any)
                relatedError: backendDto.relatedError ||
                    null // (This DTO needs to include the eventId)
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
     * @deprecated Old save flow.
     Use saveApproval instead.
     */
    async saveCorrection(body, idempotencyToken = null) {
        log.warn("DEPRECATED: saveCorrection called. Use saveApproval.");
        return Result.fail(new Error("saveCorrection is deprecated. Use saveApproval."));
    }

    /**
     * @deprecated Old save flow.
     Use saveApproval instead.
     */
    async saveResubmission(errorEventId, resubmitPayload) {
        log.warn("DEPRECATED: saveResubmission called. Use saveApproval.");
        return Result.fail(new Error("saveResubmission is deprecated. Use saveApproval."));
    }

    /**
     * NEW METHOD: Submits a corrected payload to resolve a processing error.
     * This is the new "Save" logic for the editor.
     * @param {string} barcode - The barcode of the order being resolved.
     * @param {object} correctionPayload - The OrderCorrectionRequestDTO.
     */
    async saveApproval(barcode, correctionPayload) {
        if (!barcode) {
            return Result.fail(new Error("Cannot save: Barcode is missing."));
        }
        if (!correctionPayload) {
            return Result.fail(new Error("Cannot save: Correction payload is missing."));
        }

        try {
            // POST /api/orders/{barcode}/approve
            const res = await this.client.post(
                `/api/orders/${encodeURIComponent(barcode)}/approve`,
                correctionPayload
            );
            return Result.ok(res.data || true);
        } catch (e) {
            console.error(`Error saving correction for barcode ${barcode}:`, e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to save correction.";
            return Result.fail(new Error(errorMessage));
        }
    }


    async getTriageKpis() {
        try {
            const res = await this.client.get(`/api/dashboard/kpis`);
            const data = res.data || { pendingReviewCount: 0, automatedClearancePercent: 0, avgResolutionMinutes: null };
            return Result.ok(data);
        } catch (e) {
            console.error("Error fetching triage KPIs:", e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to fetch KPIs.";
            return Result.fail(new Error(errorMessage));
        }
    }

    async getPendingByErrorType() {
        try {
            const res = await this.client.get(`/api/dashboard/pending-by-error-type`);
            const data = res.data || [];
            return Result.ok(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error fetching pending by error type:", e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to fetch pending errors by type.";
            return Result.fail(new Error(errorMessage));
        }
    }

    async sendClientLogs(logEntries) {
        if (!Array.isArray(logEntries) || logEntries.length === 0) {
            return Promise.resolve();
        }
        // Fire-and-forget, don't await, don't return Result
        this.client.post(`/api/log/client`, logEntries).catch(err => {
            console.warn("Failed to send client logs:", err.message);
        });
        return Promise.resolve();
    }

    async requestGetAvailableProviders() { return this.client.get(`/api/admin/address-verification/providers/available`); }
    async requestGetCurrentProvider() { return this.client.get(`/api/admin/address-verification/providers/current`);
    }
    async requestSetProvider(providerName) { return this.client.post(`/api/admin/address-verification/providers/current`, providerName, { headers: { 'Content-Type': 'text/plain' } });
    }
    async getOperationStatus(correlationId) { return this.client.get(`/api/admin/address-verification/operations/${correlationId}`); }

    _getStoredAddressLabel(reasonCode, side) {
        // --- *** FIX: Show raw reason code *** ---
        if (reasonCode) return reasonCode;
// --- *** END FIX *** ---

        // Fallback for older data that might not have a reason code
        return `Original ${side}`;
    }

    _safeParseJson(jsonString) {
        if (!jsonString) return null;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Failed to parse JSON string in AddressExceptionApi:", e);
            return null;
        }
    }
}

// Basic logger shim
const log = {
    warn: (...args) => console.warn(...args),
};