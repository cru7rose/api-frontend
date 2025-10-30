/**
 * ARCHITECTURE: ProviderGuard enforces that TES address provider is GOOGLE before verification flows run.
 * It follows the manifesto by isolating cross-cutting preconditions and exposing a single guard method.
 * Responsibilities:
 * - Read current provider via DANXILS-API proxy; if not GOOGLE, request it be set to GOOGLE.
 * - Since the backend uses Kafka, this involves initiating requests and polling for completion status.
 * - Cache the result to avoid redundant network calls during the session.
 */
import apiClient from "@/services/Api.js";
import { TesOperationPoller } from "@/services/TesOperationPoller";

export class ProviderGuard {
    constructor(poller = new TesOperationPoller()) {
        this._aligned = false;
        this._inFlight = null;
        this._poller = poller;
    }

    async ensureGoogle() {
        if (this._aligned) return true;
        if (this._inFlight) return this._inFlight;

        this._inFlight = (async () => {
            try {
                const getCurrentResponse = await apiClient.get("/api/admin/address-verification/providers/current");
                if (getCurrentResponse.status !== 202 || !getCurrentResponse.data?.correlationId) {
                    throw new Error("Failed to initiate get-current-provider request.");
                }
                const currentProviderResult = await this._poller.waitFor(getCurrentResponse.data.correlationId);
                if (currentProviderResult.status !== 'COMPLETED') {
                    throw new Error(`Polling for current provider failed: ${currentProviderResult.errorDetails || 'Unknown error'}`);
                }

                const currentProviderName = currentProviderResult.result;
                if (typeof currentProviderName === 'string' && currentProviderName.toUpperCase() === "GOOGLE") {
                    this._aligned = true;
                    return true;
                }

                console.warn(`TES Provider is '${currentProviderName}', attempting to set to GOOGLE.`);
                const setProviderResponse = await apiClient.post("/api/admin/address-verification/providers/current", "GOOGLE", {
                    headers: { "Content-Type": "text/plain" },
                });
                if (setProviderResponse.status !== 202 || !setProviderResponse.data?.correlationId) {
                    throw new Error("Failed to initiate set-current-provider request.");
                }
                const setProviderResult = await this._poller.waitFor(setProviderResponse.data.correlationId);
                if (setProviderResult.status !== 'COMPLETED') {
                    throw new Error(`Polling for set provider failed: ${setProviderResult.errorDetails || 'Unknown error'}`);
                }

                this._aligned = true;
                console.log("Successfully requested TES provider alignment to GOOGLE.");
                return true;
            } catch (error) {
                this._aligned = false;
                console.error("ProviderGuard alignment failed:", error);
                throw new Error(`Failed to ensure TES provider is GOOGLE: ${error.message}`);
            } finally {
                this._inFlight = null;
            }
        })();

        return this._inFlight;
    }
}
