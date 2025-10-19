/**
 * ARCHITECTURE: GoogleErrorTranslator maps Google Maps/Places status messages to stable application errors.
 * It follows the manifesto by isolating third-party semantics from business logic and controllers.
 * Responsibilities:
 * - Translate known status/error strings to canonical codes and user-friendly messages.
 * - Provide a simple translate(err) that returns {code,message,retryable}.
 */
export class GoogleErrorTranslator {
  constructor() {
    this._map = new Map();
    this._map.set("OVER_QUERY_LIMIT", { code: "RATE_LIMIT", message: "Google quota exceeded", retryable: true });
    this._map.set("ZERO_RESULTS", { code: "NO_RESULTS", message: "No results found", retryable: false });
    this._map.set("REQUEST_DENIED", { code: "DENIED", message: "Request denied by Google", retryable: false });
    this._map.set("INVALID_REQUEST", { code: "INVALID", message: "Invalid geocoding request", retryable: false });
    this._map.set("UNKNOWN_ERROR", { code: "UNKNOWN", message: "Temporary Google error", retryable: true });
  }

  translate(error) {
    const msg = (error?.message || "").toUpperCase();
    for (const [k, v] of this._map.entries()) {
      if (msg.includes(k)) return v;
    }
    const status = error?.status || error?.response?.status || null;
    if (status === 429) return { code: "RATE_LIMIT", message: "Rate limit reached", retryable: true };
    if (status === 503) return { code: "UNAVAILABLE", message: "Service unavailable", retryable: true };
    return { code: "GENERIC", message: error?.message || "Unexpected Google error", retryable: false };
  }
}
