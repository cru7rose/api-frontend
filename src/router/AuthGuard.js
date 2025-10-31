// ============================================================================
// Frontend: Update router/AuthGuard.js (Supersedes previous version)
// REASON: Aligns with manifesto. Uses the Pinia authStore as the single source
//         of truth for auth state, removing the need for AuthSessionService.
// ============================================================================
import { useAuthStore } from "@/stores/authStore";
import { ApiAuthBinder } from "@/services/ApiAuthBinder";

/**
 * ARCHITECTURE: AuthGuard protects routes by requiring an authenticated session.
 * REFACTORED: Now uses the Pinia useAuthStore as the single source of truth.
 * - Binds token on entry if not already bound.
 */
export class AuthGuard {
    constructor(binder = new ApiAuthBinder()) {
        this.binder = binder;
        // Note: We cannot call useAuthStore() here in the constructor as Pinia
        // is not initialized yet. We must call it inside the canEnter method.
    }

    async canEnter(to) {
        const path = String(to?.path || "");
        if (path.startsWith("/login")) return true;

        // Get the auth store *inside* the method
        const authStore = useAuthStore();

        // 1. Initialize store from localStorage if it hasn't been
        if (!authStore._isInitialized) {
            authStore.initializeAuth();
        }

        // 2. Check if the store considers the user authenticated
        if (authStore.isAuthenticated) {
            // 3. Ensure the API binder has the token (in case of page reload)
            if (authStore.accessToken) {
                this.binder.bind(authStore.accessToken, "Bearer");
            }
            return true;
        }

        // 4. If not authenticated, fail the guard
        throw new Error("AuthGuard: unauthenticated.");
    }
}