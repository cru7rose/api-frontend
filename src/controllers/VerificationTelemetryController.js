/**
 * ARCHITECTURE: VerificationTelemetryController (Stub) would be responsible for
 * emitting detailed, structured telemetry events specific to the address
 * verification lifecycle (e.g., timings, provider success/fail, user choices).
 * Composes the base TelemetryService.
 */
import { TelemetryService } from "@/services/TelemetryService"; // Assuming base service exists

export class VerificationTelemetryController {
    constructor(telemetryService = new TelemetryService()) {
        this.telemetry = telemetryService;
        this.currentCorrelation = null;
        this.startTime = 0;
    }

    /**
     * Starts a new verification telemetry trace.
     * @param {string} correlationId - A unique ID for this verification flow.
     * @returns {string} The correlation ID.
     */
    start(correlationId) {
        this.currentCorrelation = correlationId || `telemetry-${Date.now()}-${Math.random()}`;
        this.startTime = Date.now();
        this.telemetry.emit({
            category: "verification",
            name: "start",
            corr: this.currentCorrelation,
        });
        return this.currentCorrelation;
    }

    /**
     * Marks a specific milestone within the verification flow.
     * @param {string} name - Name of the milestone (e.g., "verify-start", "geocode-finish").
     * @param {object} data - Additional context data.
     */
    mark(name, data = {}) {
        this.telemetry.emit({
            category: "verification",
            name: name,
            data: {
                ...data,
                elapsedMs: Date.now() - this.startTime,
            },
            corr: this.currentCorrelation,
        });
    }

    /**
     * Finishes the verification telemetry trace with a final status.
     * @param {string} status - The final outcome (e.g., "ok", "save-failed", "invalid").
     * @param {object} data - Additional context data.
     */
    finish(status, data = {}) {
        this.telemetry.emit({
            category: "verification",
            name: "finish",
            data: {
                ...data,
                status,
                totalElapsedMs: Date.now() - this.startTime,
            },
            corr: this.currentCorrelation,
        });
        // Clear context for the next trace
        this.currentCorrelation = null;
        this.startTime = 0;
    }
}