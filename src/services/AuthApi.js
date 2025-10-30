// ============================================================================
// AuthApi — thin wrapper around the shared axios client
// Endpoints match backend exactly: /auth/login, /auth/refresh, /auth/logout
// ============================================================================
import api from '@/services/Api.js';

export class AuthApi {
  async login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    // Expect { accessToken, refreshToken, username, ... }
    return { ok: true, value: data };
  }

  async refresh(refreshToken) {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return { ok: true, value: data };
  }

  async logout() {
    await api.post('/auth/logout');
    return { ok: true };
  }
}
