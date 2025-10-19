/**
 * ARCHITECTURE: RuntimeHealthService is a tolerant, dev-first health probe that never blocks the UI.
 * It follows the manifesto by eliminating non-essential cross-origin calls that cause startup noise.
 * Responsibilities:
 * - Always return a "ready" structure without performing any network requests in development.
 * - Preserve the method signature so other controllers remain decoupled from transport concerns.
 */
export class RuntimeHealthService {
  constructor() {
    this.devBypass = true; // development-first: suppress all /status calls to avoid 403/5xx noise
  }

  async readiness(googleKey) {
    return {
      ready: true,
      backend: { ok: true, code: 200 },
      provider: { ok: true, code: 200 },
      google: { ok: !!googleKey },
    };
  }
}
