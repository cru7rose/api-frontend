/**
 * ARCHITECTURE: AuthApi encapsulates authentication HTTP calls against the backend auth service.
 * It follows the manifesto by isolating transport details and returning deterministic Result objects.
 * Responsibilities:
 * - POST credentials to /auth/login and return a normalized session object on success.
 * - Keep transport client injectable for testing; default to the Shared Axios instance.
 */
import api from "@/services/Api.js";
import { Result } from "@/domain/Result";

export class AuthApi {
  constructor(httpClient = api) {
    this.http = httpClient;
  }

  async login(username, password) {
    try {
      const res = await this.http.post("/auth/login", { username, password });
      const data = res?.data || {};
      const session = {
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null,
        tokenType: data.tokenType || "Bearer",
        username: data.username || username || null,
        roles: Array.isArray(data.roles) ? data.roles : [],
      };
      if (!session.accessToken) return Result.fail(new Error("AuthApi: accessToken missing in response."));
      return Result.ok(session);
    } catch (e) {
      return Result.fail(e instanceof Error ? e : new Error("AuthApi: login failed"));
    }
  }
}
