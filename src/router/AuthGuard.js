/**
 * ARCHITECTURE: AuthGuard protects routes by requiring an authenticated session from AuthSessionService.
 * It follows the manifesto by isolating navigation policy and avoiding component-level auth checks.
 * Responsibilities:
 * - canEnter(to): allow /login; require a token otherwise; throw to redirect.
 */
import { AuthSessionService } from "@/services/AuthSessionService";

export class AuthGuard {
  constructor(session = new AuthSessionService()) {
    this.session = session;
  }

  async canEnter(to) {
    const path = String(to?.path || "");
    if (path.startsWith("/login")) return true;
    if (this.session.isAuthenticated()) return true;
    throw new Error("AuthGuard: unauthenticated.");
  }
}
