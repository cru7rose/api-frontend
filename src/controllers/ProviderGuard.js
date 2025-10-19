/**
 * ARCHITECTURE: ProviderGuard enforces that TES address provider is GOOGLE before verification flows run.
 * It follows the manifesto by isolating cross-cutting preconditions and exposing a single guard method.
 * Responsibilities:
 * - Read current provider; if not GOOGLE, set it to GOOGLE using admin API.
 * - Cache the result to avoid redundant network calls during the session.
 */
import apiClient from "@/services/api";

export class ProviderGuard {
  constructor() {
    this._aligned = false;
    this._inFlight = null;
  }

  async ensureGoogle() {
    if (this._aligned) return true;
    if (this._inFlight) return this._inFlight;
    this._inFlight = this._align();
    try {
      const r = await this._inFlight;
      this._aligned = true;
      return r;
    } finally {
      this._inFlight = null;
    }
  }

  async _align() {
    const current = await apiClient.get("/api/admin/address-verification/providers/current");
    if (current?.data?.provider === "GOOGLE") return true;
    await apiClient.post("/api/admin/address-verification/providers/current", "GOOGLE", {
      headers: { "Content-Type": "text/plain" },
    });
    return true;
  }
}
