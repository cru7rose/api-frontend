// ============================================================================
// Frontend: Update IdempotentSaveController (Supersedes previous version)
// FILE: src/controllers/IdempotentSaveController.js
// REASON: Refactor save() to accept the new /approve payload.
// ============================================================================
// FILE: src/controllers/IdempotentSaveController.js (Supersedes previous version)

import { Result } from "@/domain/Result";
// Removed: import { AddressPersistenceMapper } from "@/services/AddressPersistenceMapper";
import { IdempotencyTokenService } from "@/services/IdempotencyTokenService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

/**
 * ARCHITECTURE: Wraps AddressExceptionApi with idempotency token generation.
 * REFACTORED:
 * - No longer uses AddressPersistenceMapper.
 * - Accepts the payload required by AddressExceptionApi.saveCorrection
 * (i.e., { barcode, resolveCoordinatesIfNeeded, ...other token fields... })
 */
export class IdempotentSaveController {
  constructor(api = new AddressExceptionApi(), mapper = null, tokens = new IdempotencyTokenService()) {
    this.api = api;
    // this.mapper = mapper; // No longer used
    this.tokens = tokens;
  }

  async save(payload) {
    const orderId = payload?.orderId;
    const side = payload?.side || "both";
    const barcode = payload?.barcode;
    const resolveFlag = payload?.resolveCoordinatesIfNeeded || false;

    if (!barcode) {
      return Result.fail(new Error("IdempotentSaveController: Barcode is required in payload."));
    }

    // Create the body that AddressExceptionApi.saveCorrection expects
    const body = {
      barcode: barcode,
      resolveCoordinatesIfNeeded: resolveFlag
    };

    // Generate token based on orderId, side, and the *intended* changes
    // (We still use 'after' for token generation, even if not sent in 'body')
    const tokenPayload = {
      after: payload?.after || null,
      resolve: resolveFlag
    };
    const token = this.tokens.create(orderId, side, JSON.stringify(tokenPayload));

    // Call the API
    const res = await this.api.saveCorrection(body, token);
    return res.ok ? Result.ok(res.value) : Result.fail(res.error);
  }
}