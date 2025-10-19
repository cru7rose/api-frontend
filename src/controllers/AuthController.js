/**
 * ARCHITECTURE: AuthController coordinates login/logout by composing AuthApi, AuthSessionService, and ApiAuthBinder.
 * It follows the manifesto by exposing intent-driven methods and returning Result objects for views/guards.
 * Responsibilities:
 * - login(username,password): call AuthApi, persist session, bind Authorization header.
 * - logout(): clear session and unbind header.
 * - hydrateFromStorage(): reapply header on app start.
 * - snapshot(): expose {isAuthenticated,user}.
 */
import { Result } from "@/domain/Result";
import { AuthApi } from "@/services/AuthApi";
import { AuthSessionService } from "@/services/AuthSessionService";
import { ApiAuthBinder } from "@/services/ApiAuthBinder";

export class AuthController {
  constructor(api = new AuthApi(), session = new AuthSessionService(), binder = new ApiAuthBinder()) {
    this.api = api;
    this.session = session;
    this.binder = binder;
  }

  async login(username, password) {
    const r = await this.api.login(username, password);
    if (!r.ok) return Result.fail(r.error);
    this.session.save(r.value);
    this.binder.bind(r.value.accessToken, r.value.tokenType);
    return Result.ok(this.snapshot());
  }

  async logout() {
    this.session.clear();
    this.binder.unbind();
    return Result.ok(true);
  }

  hydrateFromStorage() {
    const token = this.session.getAccessToken();
    const type = this.session.getTokenType();
    if (token) this.binder.bind(token, type);
    return this.snapshot();
  }

  snapshot() {
    return {
      isAuthenticated: this.session.isAuthenticated(),
      user: this.session.getUser(),
      tokenPresent: !!this.session.getAccessToken(),
    };
  }
}
