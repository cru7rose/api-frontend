/**
 * ARCHITECTURE: TelemetryService emits structured events for operational analytics without UI coupling.
 * Buffers events and flushes periodically using navigator.sendBeacon (if available) or console fallback.
 * Adheres to SRP by isolating event formatting and transport logic.
 */
export class TelemetryService {
    constructor(transportFn = null, flushIntervalMs = 15000, maxBuffer = 100) {
        // Use provided transport or default to beacon/console transport
        this.transportFn = typeof transportFn === "function"
            ? transportFn
            : this._defaultBeaconTransport; // Use beacon transport as default

        this.flushIntervalMs = Math.max(1000, flushIntervalMs);
        this.maxBuffer = Math.max(1, maxBuffer);
        this._buf = [];
        this._timer = null;
        // Endpoint for beacon/fetch - should be configurable
        this._telemetryEndpoint = "/api/telemetry"; // Example endpoint
    }

    /** Starts the periodic flushing mechanism. */
    start() {
        if (this._timer) return false;
        this._timer = setInterval(() => {
            this.flush().catch(err => console.error("[TelemetryService] Flush error:", err));
        }, this.flushIntervalMs);
        console.log("[TelemetryService] Started periodic flush.");
        // Add listener for page unload to attempt final flush
        if (typeof window !== "undefined") {
            window.addEventListener('unload', this._unloadFlushHandler);
        }
        return true;
    }

    /** Stops the periodic flushing mechanism. */
    stop() {
        if (!this._timer) return false;
        clearInterval(this._timer);
        this._timer = null;
        if (typeof window !== "undefined") {
            window.removeEventListener('unload', this._unloadFlushHandler);
        }
        console.log("[TelemetryService] Stopped periodic flush.");
        // Optional: Perform a final flush on explicit stop
        // this.flush().catch(err => console.error("[TelemetryService] Final flush error:", err));
        return true;
    }

    // Bound handler for unload event
    _unloadFlushHandler = () => {
        // Use sendBeacon for unload, as async fetch might be cancelled
        this._flushWithBeacon();
    };

    /** Emits a telemetry event, adding it to the buffer. */
    emit(event) {
        if (!event || !event.name) {
            console.warn("[TelemetryService] Invalid event emitted (missing name):", event);
            return null;
        }
        const e = {
            at: Date.now(),
            category: event?.category || "general",
            name: event.name,
            data: event?.data || {},
            corr: event?.corr || null, // Correlation ID from event context
            // Add session/user info if available globally
            // sessionId: getSessionId(),
            // userId: getUserId(),
        };
        this._buf.push(e);
        if (this._buf.length >= this.maxBuffer) {
            // Use regular flush when buffer is full (not on unload)
            this.flush().catch(err => console.error("[TelemetryService] Auto-flush error:", err));
        }
        return e;
    }

    /** Flushes the buffered events using the configured transport function. */
    async flush() {
        if (this._buf.length === 0) {
            return 0; // Nothing to flush
        }
        // Use the configured transport (beacon/console by default)
        return await this._executeFlush(this.transportFn);
    }

    /** Attempts a synchronous flush using sendBeacon, suitable for unload events. */
    _flushWithBeacon() {
        if (this._buf.length === 0 || typeof navigator?.sendBeacon !== 'function') {
            return 0; // Nothing to flush or beacon not available
        }
        // Use the beacon transport directly for unload
        const batch = this._buf.splice(0, this._buf.length);
        try {
            const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
            navigator.sendBeacon(this._telemetryEndpoint, blob);
            // Cannot reliably log success/failure from sendBeacon
            // console.log(`[TelemetryService] Attempted beacon flush of ${batch.length} events on unload.`);
            return batch.length;
        } catch (error) {
            console.error("[TelemetryService] sendBeacon failed:", error);
            // Cannot reliably re-queue on unload
            return 0;
        }
    }


    /** Internal helper to execute flush logic and handle errors */
    async _executeFlush(transport) {
        if (!transport || this._buf.length === 0) {
            return 0;
        }
        const batch = this._buf.splice(0, this._buf.length);
        try {
            await transport(batch);
            // console.debug(`[TelemetryService] Flushed ${batch.length} events via ${transport.name}.`);
            return batch.length;
        } catch (error) {
            console.error("[TelemetryService] Transport function failed:", error);
            // Simple strategy: Drop failed batch. Implement retry/queueing if needed.
            // this._buf.unshift(...batch); // Example: Re-queue (use with caution)
            throw error;
        }
    }

    /** Default transport using navigator.sendBeacon if available, falling back to console. */
    async _defaultBeaconTransport(batch) {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
                // Use sendBeacon for background-safe sending, fire-and-forget
                const success = navigator.sendBeacon(this._telemetryEndpoint, blob);
                if (!success) {
                    console.warn("[TelemetryService] navigator.sendBeacon returned false, data might not have been sent.");
                    // Fallback to fetch if beacon fails immediately? Might be too late.
                }
            } catch (error) {
                console.error("[TelemetryService] Error using navigator.sendBeacon:", error);
                // Fallback to console if beacon throws (should be rare)
                console.log("[TelemetryService Fallback Console]", JSON.stringify(batch, null, 2));
            }
        } else {
            // Fallback for environments without sendBeacon
            console.log("[TelemetryService Fallback Console]", JSON.stringify(batch, null, 2));
            // Alternative: Use fetch API here, but it's not guaranteed on unload
            /* try {
                await fetch(this._telemetryEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batch),
                    keepalive: true // Important for unload scenarios, but not universally supported
                });
            } catch (fetchError) {
                console.error("[TelemetryService Fallback Fetch Error]:", fetchError);
            } */
        }
    }
}