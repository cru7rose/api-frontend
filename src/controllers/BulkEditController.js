/**
 * ARCHITECTURE: BulkEditController previews and applies batch text transforms across selected orders.
 * It follows the manifesto by isolating batch logic and delegating transport to AddressExceptionApi.
 * Responsibilities:
 * - Preview client-side transformations for confidence; apply changes via backend endpoint.
 * - Accept BulkEditPlan JSON and return Result objects for both preview and apply.
 */
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class BulkEditController {
  constructor(storeOrApi = null) {
    this.api = storeOrApi instanceof AddressExceptionApi ? storeOrApi : new AddressExceptionApi();
  }

  async preview(plan) {
    try {
      const { data } = await this._post("/bulk/preview", plan);
      return Result.ok(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      return Result.fail(e);
    }
  }

  async apply(plan) {
    try {
      const { data } = await this._post("/bulk/apply", plan);
      return Result.ok(data || true);
    } catch (e) {
      return Result.fail(e);
    }
  }

  async _post(path, plan) {
    const url = `/api/address-exceptions${path}`;
    return await (await import("@/services/api")).default.post(url, plan.toJSON ? plan.toJSON() : plan);
  }
}
