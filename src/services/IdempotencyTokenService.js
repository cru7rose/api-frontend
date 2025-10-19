/**
 * ARCHITECTURE: IdempotencyTokenService creates deterministic tokens for save requests.
 * It follows the manifesto by isolating token generation from controllers and transport layers.
 * Responsibilities:
 * - Produce a stable hash-like token from orderId, side, and payload string.
 */
export class IdempotencyTokenService {
  create(orderId, side, payloadString) {
    const base = `${orderId || ""}|${side || "both"}|${payloadString || ""}`;
    // Simple Fowler–Noll–Vo (FNV-1a) 32-bit hash for deterministic tokens
    let h = 0x811c9dc5;
    for (let i = 0; i < base.length; i++) {
      h ^= base.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return `idem-${h.toString(16)}`;
  }
}
