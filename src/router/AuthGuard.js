/**
 * ARCHITECTURE: AuthGuard protects routes by requiring an authenticated session.
 * It follows the manifesto by isolating navigation policy and tolerating a minimal localStorage token.
 * Responsibilities:
 * - Allow /login always.
 * - Accept session from AuthSessionService; if absent, fall back to localStorage.accessToken and bind header.
 */
import { AuthSessionService } from "@/services/AuthSessionService";
import { ApiAuthBinder } from "@/services/ApiAuthBinder";

export class AuthGuard {
    constructor(session = new AuthSessionService(), binder = new ApiAuthBinder()) {
        this.session = session;
        this.binder = binder;
    }

    async canEnter(to) {
        const path = String(to?.path || "");
        if (path.startsWith("/login")) return true;

        // Primary: full session saved by AuthController
        if (this.session.isAuthenticated()) {
            const tok = this.session.getAccessToken();
            const typ = this.session.getTokenType();
            if (tok) this.binder.bind(tok, typ);
            return true;
        }

        // Tolerant fallback: plain token in localStorage (e.g., from earlier minimal form)
        if (typeof window !== "undefined") {
            const raw = window.localStorage?.getItem("accessToken");
            if (raw && raw.length > 10) {
                this.binder.bind(raw, "Bearer");
                return true;
            }
        }

        throw new Error("AuthGuard: unauthenticated.");
    }
}
