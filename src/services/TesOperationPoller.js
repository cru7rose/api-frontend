/**
 * ARCHITECTURE: TesOperationPoller handles polling the DANXILS-API status endpoint
 * for asynchronous operations initiated via Kafka proxies.
 * Responsibilities:
 * - Poll a given status URL until the operation status is COMPLETED or FAILED.
 * - Implement configurable retry limits and polling intervals.
 * - Return the final operation status and result/error.
 */
import apiClient from '@/services/api';

export class TesOperationPoller {
    constructor(defaultIntervalMs = 2000, defaultMaxRetries = 15) {
        this.intervalMs = defaultIntervalMs;
        this.maxRetries = defaultMaxRetries;
    }

    async waitFor(correlationId, intervalMs = this.intervalMs, maxRetries = this.maxRetries) {
        if (!correlationId) {
            throw new Error("TesOperationPoller: correlationId is required.");
        }

        const statusUrl = `/api/admin/address-verification/operations/${correlationId}`;
        console.debug(`Polling status for ${correlationId} at ${statusUrl}...`);

        for (let i = 0; i < maxRetries; i++) {
            try {
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }

                const statusResponse = await apiClient.get(statusUrl);
                const operation = statusResponse.data;

                if (!operation || !operation.status) {
                    console.warn(`Polling for ${correlationId}: Received unexpected response. Retrying...`);
                    continue;
                }

                console.debug(`Polling for ${correlationId}: Attempt ${i+1}/${maxRetries}, Status: ${operation.status}`);

                if (operation.status === 'COMPLETED') {
                    let parsedResult = operation.responsePayloadJson;
                    if (parsedResult && typeof parsedResult === 'string') {
                        try {
                            parsedResult = JSON.parse(parsedResult);
                        } catch (parseError) {
                            console.warn(`Polling for ${correlationId}: Completed, but failed to parse responsePayloadJson`, parseError);
                        }
                    }
                    return { ...operation, result: parsedResult };
                }

                if (operation.status === 'FAILED') {
                    return { ...operation, errorDetails: operation.errorMessage };
                }

            } catch (error) {
                if (error.response?.status === 404) {
                    console.warn(`Polling for ${correlationId}: Received 404. Retrying (attempt ${i+1}/${maxRetries})...`);
                } else {
                    console.error(`Polling for ${correlationId}: Error during attempt ${i+1}:`, error);
                }
            }
        }

        throw new Error(`Polling for operation ${correlationId} timed out after ${maxRetries} attempts.`);
    }
}
