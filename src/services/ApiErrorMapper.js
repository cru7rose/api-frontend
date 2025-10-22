/**
 * ARCHITECTURE: ApiErrorMapper (Stub) translates backend HTTP error responses
 * into user-facing, domain-specific error messages or error objects.
 * This isolates HTTP error structure from controllers.
 */
import { Result } from "@/domain/Result";

export class ApiErrorMapper {
    constructor() {
        // Map of known backend error codes/messages to frontend-friendly text
        this.errorMap = {
            "validation_failed": "The data provided was invalid. Please check the fields.",
            "duplicate_barcode": "This barcode already exists in the system.",
            "auth_invalid_credentials": "Invalid username or password.",
        };
    }

    /**
     * Maps an Axios error object to a frontend-friendly Error object.
     * @param {Error} axiosError - The error object from an Axios request.
     * @returns {Error} A new Error object with a user-friendly message.
     */
    map(axiosError) {
        if (!axiosError) {
            return new Error("An unknown error occurred.");
        }

        const responseData = axiosError.response?.data;
        const status = axiosError.response?.status;

        if (status === 401) {
            return new Error("Authentication failed. Please log in again.");
        }

        if (status === 403) {
            return new Error("You do not have permission to perform this action.");
        }

        // Check for specific backend error code
        const backendErrorCode = responseData?.errorCode; // Assuming backend sends { "errorCode": "...", ... }
        if (backendErrorCode && this.errorMap[backendErrorCode]) {
            return new Error(this.errorMap[backendErrorCode]);
        }

        // Check for Spring Boot validation errors
        if (status === 422 && Array.isArray(responseData?.details)) {
            return new Error(`Validation failed: ${responseData.details.join(', ')}`);
        }

        // Fallback to message from backend payload or default
        const message = responseData?.error || responseData?.message || axiosError.message || "An unknown server error occurred.";
        return new Error(message);
    }

    /**
     * Wraps an API call (a function returning a Promise) with error mapping.
     * @param {Function} apiCallFn - An async function (e.g., () => apiClient.get('/...')).
     * @returns {Promise<Result<any, Error>>} A Result object.
     */
    async wrap(apiCallFn) {
        try {
            const response = await apiCallFn();
            return Result.ok(response.data); // Assumes success is response.data
        } catch (error) {
            return Result.fail(this.map(error));
        }
    }
}