/**
 * ARCHITECTURE: AuthSessionService persists auth tokens and user profile and exposes accessors.
 * It follows the manifesto by isolating storage mechanics and providing deterministic getters/setters.
 * Responsibilities:
 * - Save/load/remove session in localStorage with a namespaced key.
 * - Expose isAuthenticated(), getAccessToken(), getTokenType(), getUser(), hasRole().
 */
export class AuthSessionService {
  constructor(namespace = "danxils_auth") {
    this.ns = namespace;
    this.store = typeof window !== "undefined" ? window.localStorage : null;
  }

  save(session) {
    if (!this.store) return false;
    const payload = {
      accessToken: session?.accessToken || null,
      refreshToken: session?.refreshToken || null,
      tokenType: session?.tokenType || "Bearer",
      username: session?.username || null,
      roles: Array.isArray(session?.roles) ? session.roles : [],
      at: Date.now(),
    };
    this.store.setItem(this.ns, JSON.stringify(payload));
    return true;
  }

  load() {
    if (!this.store) return null;
    const raw = this.store.getItem(this.ns);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  clear() {
    if (!this.store) return false;
    this.store.removeItem(this.ns);
    return true;
  }

  isAuthenticated() {
    const s = this.load();
    return !!(s && s.accessToken);
  }

  getAccessToken() {
    const s = this.load();
    return s?.accessToken || null;
  }

  getTokenType() {
    const s = this.load();
    return s?.tokenType || "Bearer";
  }

  getUser() {
    const s = this.load();
    return { username: s?.username || null, roles: Array.isArray(s?.roles) ? s.roles : [] };
  }

  hasRole(role) {
    const s = this.load();
    const roles = Array.isArray(s?.roles) ? s.roles : [];
    return roles.includes(role);
  }
}
