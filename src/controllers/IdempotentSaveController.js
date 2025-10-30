// ============================================================================
// Frontend: Mark IdempotentSaveController as Deprecated
// FILE: src/controllers/IdempotentSaveController.js
// REASON: This controller's logic (targeting /approve) is obsolete.
//         The new flow is handled by SaveFlowController targeting
//         /processing-errors/{eventId}/resubmit.
// ============================================================================
// FILE: src/controllers/IdempotentSaveController.js (Supersedes previous version)

import { Result } from "@/domain/Result";
import { IdempotencyTokenService } from "@/services/IdempotencyTokenService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

/**
 * ARCHITECTURE: Wraps AddressExceptionApi with idempotency token generation.
 * @deprecated This controller is deprecated. The new save flow is managed
 * by SaveFlowController, which builds a resubmission payload for
 * the /processing-errors endpoint and calls AddressExceptionApi.saveResubmission.
 */
export class IdempotentSaveController {
  constructor(api = new AddressExceptionApi(), mapper = null, tokens = new IdempotencyTokenService()) {
    this.api = api;
    this.tokens = tokens;
    console.warn("DEPRECATED: IdempotentSaveController is obsolete and should not be used.");
  }

  async save(payload) {
    console.error("DEPRECATED: IdempotentSaveController.save() was called. This flow is no longer supported.");
    return Result.fail(new Error("IdempotentSaveController is deprecated."));
  }
}