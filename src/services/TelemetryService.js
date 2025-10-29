// FILE: src/services/TelemetryService.js
// ENHANCED FILE
import { AddressExceptionApi } from '@/services/AddressExceptionApi'; // For sending logs
import { AuthController } from '@/controllers/AuthController'; // To potentially check auth state
import { ref } from 'vue';

const MAX_BUFFER_SIZE = 50;
const SEND_INTERVAL_MS = 15000; // Send logs every 15 seconds

/**
 * ARCHITECTURE: Simple telemetry for capturing key UI events and errors.
 * ENHANCED: Captures console logs, buffers them, and sends them periodically to the backend.
 */
export class TelemetryService {
    constructor(api = new AddressExceptionApi(), auth = new AuthController()) {
        this.api = api; // Use API service to send logs
        this.auth = auth; // To check if logged in
        this._logBuffer = ref([]); // Use ref for potential reactivity if needed later
        this._originalConsole = {};
        this._sendTimeoutId = null;
        this._isSending = false; // Prevent concurrent sends

        this._wrapConsole();
        this._startSendingInterval();
    }

    _wrapConsole() {
        const levels = ['log', 'info', 'warn', 'error', 'debug'];
        levels.forEach(level => {
            this._originalConsole[level] = console[level];
            console[level] = (...args) => {
                // Call original console method
                this._originalConsole[level]?.apply(console, args);
                // Capture and buffer the log
                this._captureLog(level, args);
            };
        });
        // Capture unhandled errors/rejections
        window.addEventListener('error', (event) => this._captureErrorEvent(event));
        window.addEventListener('unhandledrejection', (event) => this._captureUnhandledRejection(event));
    }

    _captureLog(level, args) {
        if (this._logBuffer.value.length >= MAX_BUFFER_SIZE) {
            // Optionally drop oldest log or stop buffering
            // console.warn("[Telemetry] Log buffer full, dropping oldest entry.");
            // this._logBuffer.value.shift();
            return; // Stop buffering if full for now
        }
        try {
            const message = args.map(arg => this._formatArg(arg)).join(' ');
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: level.toUpperCase(),
                message: message,
                // Add context if needed: location: window.location.pathname, userAgent: navigator.userAgent
            };
            this._logBuffer.value.push(logEntry);
        } catch(e) {
            this._originalConsole.error?.("[Telemetry] Error capturing log:", e);
        }
    }

    _captureErrorEvent(event) {
        // event: ErrorEvent
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: event.message,
            source: 'window.onerror',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? this._formatArg(event.error) : null
        };
        this._logBuffer.value.push(entry);
    }

    _captureUnhandledRejection(event) {
        // event: PromiseRejectionEvent
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: 'Unhandled promise rejection',
            source: 'window.onunhandledrejection',
            reason: event.reason ? this._formatArg(event.reason) : null
        };
        this._logBuffer.value.push(entry);
    }

    _formatArg(arg) {
        if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                // Basic object serialization, limit depth/size if needed
                return JSON.stringify(arg);
            } catch {
                return '[Unserializable Object]';
            }
        }
        return String(arg);
    }

    _startSendingInterval() {
        if (this._sendTimeoutId) clearTimeout(this._sendTimeoutId);
        this._sendTimeoutId = setInterval(() => {
            this._sendBufferedLogs();
        }, SEND_INTERVAL_MS);
    }

    async _sendBufferedLogs() {
        // Check if user is authenticated before sending
        if (!this.auth.isAuthenticatedRef.value || this._isSending) {
            return;
        }
        if (this._logBuffer.value.length === 0) {
            return;
        }

        // Important: Swap buffer immediately to avoid race conditions
        const logsToSend = this._logBuffer.value;
        this._logBuffer.value = [];
        this._isSending = true;

        try {
            this._originalConsole.debug?.(`[Telemetry] Sending ${logsToSend.length} log entries...`);
            // Use the API client method (to be created in AddressExceptionApi)
            await this.api.sendClientLogs(logsToSend);
            // Logs sent successfully
        } catch (error) {
            this._originalConsole.error?.("[Telemetry] Failed to send client logs:", error);
            // Failed: Put logs back into buffer (potentially merging with new ones)
            // Be careful about buffer size limit
            const currentBuffer = this._logBuffer.value;
            this._logBuffer.value = [...logsToSend, ...currentBuffer].slice(0, MAX_BUFFER_SIZE);
            if (this._logBuffer.value.length >= MAX_BUFFER_SIZE) {
                this._originalConsole.warn?.("[Telemetry] Log buffer full after send failure.");
            }
        } finally {
            this._isSending = false;
        }
    }

    // Method to manually trigger send (e.g., on beforeunload)
    flushLogs() {
        if (this._sendTimeoutId) clearTimeout(this._sendTimeoutId);
        this._sendTimeoutId = null; // Stop interval
        // Send any remaining logs synchronously if possible, or async
        this._sendBufferedLogs(); // Fire and forget async send
    }

    // Call this when app unloads
    destroy() {
        this.flushLogs();
        // Restore original console methods
        Object.keys(this._originalConsole).forEach(level => {
            if (console[level] === this._originalConsole[level]) return; // Already restored or never wrapped
            console[level] = this._originalConsole[level];
        });
        window.removeEventListener('error', this._captureErrorEvent);
        window.removeEventListener('unhandledrejection', this._captureUnhandledRejection);
    }

    // Existing methods (can remain or be removed if only log capture is needed)
    event(name, data = {}) {
        // console.log("[Telemetry Event]", name, data);
        this._captureLog('info', [`[Telemetry Event] ${name}`, data]);
    }
    error(err, context = {}) {
        // console.error("[Telemetry Error]", err, context);
        this._captureLog('error', ["[Telemetry Error]", err, context]);
    }
}