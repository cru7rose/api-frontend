// ============================================================================
// services/AuthApi.js
// Calls backend exactly at /auth/login|refresh|logout
// ============================================================================
import api from "@/services/Api.js";

export class AuthApi {
  async login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    return { ok: true, value: data };
  }

  async refresh(refreshToken) {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return { ok: true, value: data };
  }

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort
    }
    return { ok: true };
  }
}
