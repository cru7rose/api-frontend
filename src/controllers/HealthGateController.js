/**
 * ARCHITECTURE: HealthGateController returns a stable readiness object without external dependencies.
 * It follows the manifesto by short-circuiting health checks in dev so the shell can render immediately.
 * Responsibilities:
 * - Delegate to RuntimeHealthService (which is dev-bypassed) and forward the normalized result.
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
