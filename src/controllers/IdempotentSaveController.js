/**
 * ARCHITECTURE: IdempotentSaveController wraps AddressCorrectionService with idempotency token generation.
 * It follows the manifesto by isolating token creation and persistence concerns behind one save() method.
 * Responsibilities:
 * - Generate a deterministic token per payload and pass it down to AddressExceptionApi.
 * - Return Result objects and protect against accidental duplicate submissions.
 */
import { Result } from "@/domain/Result";
import { AddressPersistenceMapper } from "@/services/AddressPersistenceMapper";
import { IdempotencyTokenService } from "@/services/IdempotencyTokenService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class IdempotentSaveController {
  constructor(api = new AddressExceptionApi(), mapper = new AddressPersistenceMapper(), tokens = new IdempotencyTokenService()) {
    this.api = api;
    this.mapper = mapper;
    this.tokens = tokens;
  }

  async save(payload) {
    const orderId = payload?.orderId;
    const side = payload?.side || "both";
    const body = this.mapper.toSavePayload(orderId, side, payload?.before || null, payload?.after || null, payload?.resolution || "MANUAL_EDIT");
    const token = this.tokens.create(orderId, side, JSON.stringify(body));
    const res = await this.api.saveCorrection(body, token);
    return res.ok ? Result.ok(res.value) : Result.fail(res.error);
  }
}
