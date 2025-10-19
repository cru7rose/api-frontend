/**
 * ARCHITECTURE: RuntimeHealthService probes backend/provider readiness but never blocks the UI.
 * It follows the manifesto by isolating network checks and returning a tolerant structured result.
 * Responsibilities:
 * - Try GET /status/health and /status/provider; if they fail, mark as unknown but keep ready=true.
 * - Treat Google key presence as a soft signal only.
 */
import apiClient from "@/services/api";

export class RuntimeHealthService {
  async readiness(googleKey) {
    const out = {
      ready: true,                 // tolerant by default
      backend: { ok: false, code: null },
      provider: { ok: false, code: null },
      google: { ok: !!googleKey },
    };

    try {
      const h = await apiClient.get("/status/health");
      out.backend.ok = (h?.status === 200) || !!h?.data?.ok;
      out.backend.code = h?.status ?? 200;
    } catch (e) {
      out.backend.ok = false;
      out.backend.code = e?.response?.status ?? 0;
      // keep out.ready = true to avoid blocking the app when status routes are absent
    }

    try {
      const p = await apiClient.get("/status/provider");
      out.provider.ok = (p?.status === 200) || !!p?.data?.ok;
      out.provider.code = p?.status ?? 200;
    } catch (e) {
      out.provider.ok = false;
      out.provider.code = e?.response?.status ?? 0;
    }

    return out;
  }
}
