/**
 * ARCHITECTURE: HealthGateController validates backend and provider readiness for the app shell.
 * It follows the manifesto by isolating health queries and returning a minimal readiness object.
 * Responsibilities:
 * - Call RuntimeHealthService; provide {ok, backend, provider, google}.
 */
import { RuntimeHealthService } from "@/services/RuntimeHealthService";

export class HealthGateController {
  constructor(runtime = new RuntimeHealthService()) {
    this.runtime = runtime;
  }

  async readiness(googleKey) {
    const r = await this.runtime.readiness(googleKey);
    return { ok: !!r.ready, backend: !!r.backend?.ok, provider: !!r.provider?.ok, google: !!r.google?.ok };
  }
}
