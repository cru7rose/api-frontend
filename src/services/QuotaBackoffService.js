/**
 * ARCHITECTURE: QuotaBackoffService (Stub) would manage client-side rate limiting
 * or backoff strategies when interacting with external APIs (like Google)
 * that enforce quotas. This is a placeholder.
 */
import { RetryPolicy } from "@/services/RetryPolicy"; // Assumes RetryPolicy exists

export class QuotaBackoffService {
    constructor() {
        // Configure retry policy specifically for quota errors
        this.retryPolicy = new RetryPolicy(
            3, // Max 3 attempts
            500, // Base delay 500ms
            200, // Jitter 200ms
            (error) => {
                // Only retry on specific quota-related error messages or status codes
                const msg = (error?.message || "").toLowerCase();
                const status = error?.response?.status;
                return msg.includes("quota") || msg.includes("rate limit") || status === 429 || status === 503;
            }
        );
    }

    /**
     * Executes a function wrapped in the backoff/retry policy.
     * @param {Function} asyncFn - The async function to execute (e.g., () => geocoder.geocode(...)).
     * @returns {Promise<any>} The result of the async function.
     */
    async execute(asyncFn) {
        try {
            return await this.retryPolicy.execute(asyncFn);
        } catch (error) {
            console.warn("[QuotaBackoffService] Execution failed after retries:", error);
            throw error; // Re-throw the final error
        }
    }
}