// ============================================================================
// Frontend: Update AddressExceptionApi (Supersedes previous version)
// FILE: src/services/AddressExceptionApi.js
// REASON: Add missing 'getPendingByErrorType' method.
// ============================================================================
// FILE: src/services/AddressExceptionApi.js (Supersedes previous version)
import api from "@/services/api";
import { Result } from "@/domain/Result";
import { Address } from "@/domain/WorkbenchModels";

/**
 * ARCHITECTURE: API client for address-related operations.
 * UPDATED: Added getPendingByErrorType method.
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

            const originalPickup = backendDto.pickupAddress ? Address.from(backendDto.pickupAddress) : new Address();
            const originalDelivery = backendDto.deliveryAddress ? Address.from(backendDto.deliveryAddress) : new Address();
            const pickupStoredDisplay = backendDto.pickupStoredAddress ? Address.from(backendDto.pickupStoredAddress) : null;
            const deliveryStoredDisplay = backendDto.deliveryStoredAddress ? Address.from(backendDto.deliveryStoredAddress) : null;

            const pickupStoredLabel = this._getStoredAddressLabel(backendDto.pickupReasonCode, 'Pickup');
            const deliveryStoredLabel = this._getStoredAddressLabel(backendDto.deliveryReasonCode, 'Delivery');

            const frontendDetail = {
                orderId: backendDto.id,
                barcode: backendDto.barcode,
                requestId: backendDto.requestId,
                customerId: backendDto.customerId,
                sourceSystem: backendDto.sourceSystem,
                processingStatus: backendDto.processingStatus,
                createdAt: backendDto.createdAt,
                updatedAt: backendDto.updatedAt,
                pickupAlias: backendDto.pickupAlias || null,
                deliveryAlias: backendDto.deliveryAlias || null,
                originalPickup: originalPickup,
                originalDelivery: originalDelivery,
                pickupReasonCode: backendDto.pickupReasonCode || null,
                deliveryReasonCode: backendDto.deliveryReasonCode || null,
                pickupStoredAddress: pickupStoredDisplay,
                deliveryStoredAddress: deliveryStoredDisplay,
                pickupStoredLabel: pickupStoredLabel,
                deliveryStoredLabel: deliveryStoredLabel,
                suggestedPickup: Array.isArray(backendDto.suggestedPickup) ? backendDto.suggestedPickup : [],
                suggestedDelivery: Array.isArray(backendDto.suggestedDelivery) ? backendDto.suggestedDelivery : [],
                relatedError: backendDto.relatedError || null
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

    async saveCorrection(body, idempotencyToken = null) {
        const barcode = body?.barcode;
        if (!barcode) {
            return Result.fail(new Error("Barcode is required to approve the correction."));
        }
        const approvePayload = {
            resolveCoordinatesIfNeeded: body?.resolveCoordinatesIfNeeded || false
        };
        try {
            const headers = idempotencyToken ? { "Idempotency-Key": idempotencyToken } : {};
            const res = await this.client.post(`/api/orders/${encodeURIComponent(barcode)}/approve`, approvePayload, { headers });
            return Result.ok(res.data || true);
        } catch (e) {
            console.error(`Error saving/approving correction for barcode ${barcode}:`, e);
            const errorMessage = e.response?.data?.error || e.message || "Failed to save/approve correction.";
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

    // *** ADDED THIS METHOD ***
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
    // *** END ADDED METHOD ***

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
    async requestGetCurrentProvider() { return this.client.get(`/api/admin/address-verification/providers/current`); }
    async requestSetProvider(providerName) { return this.client.post(`/api/admin/address-verification/providers/current`, providerName, { headers: { 'Content-Type': 'text/plain' } }); }
    async getOperationStatus(correlationId) { return this.client.get(`/api/admin/address-verification/operations/${correlationId}`); }

    _getStoredAddressLabel(reasonCode, side) {
        if (reasonCode === 'ALIAS_MATCH_CONFIRMED') return `Stored (TrackIT - Matched)`;
        if (reasonCode === 'ALIAS_MISMATCH') return `Stored (TrackIT - Mismatch)`;
        if (reasonCode === 'ALIAS_NOT_FOUND') return `Original ${side}`;
        return `Stored (TrackIT - if mismatched)`;
    }
}