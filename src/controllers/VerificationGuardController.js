/**
 * ARCHITECTURE: VerificationGuardController prevents unnecessary verification calls when input is incomplete.
 * It follows the manifesto by enforcing minimal field requirements before hitting providers.
 * Responsibilities:
 * - Check street, postal, and city presence; expose shouldVerify() with reason codes for UI hints.
 * - Reduce wasted quota and noise during live typing.
 */
export class VerificationGuardController {
  constructor() {
    this.required = ["street", "postalCode", "city"];
  }

  shouldVerify(input) {
    const missing = [];
    for (const f of this.required) {
      if (!input || !String(input[f] || "").trim()) missing.push(f);
    }
    if (missing.length) return { allow: false, reason: "MISSING_FIELDS", missing };
    return { allow: true, reason: "OK", missing: [] };
  }
}
