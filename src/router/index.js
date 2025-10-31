// ============================================================================
// Frontend ➜ router/index.js (Final Version)
// REASON: Ensure GeoRuntime is passed, guards are correctly instantiated and used.
// REASON (REQ 2): Add new route for OrderAdminView.
// ============================================================================
// FILE: src/router/index.js

import { createRouter as vueCreateRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import WorklistView from "@/views/WorklistView.vue";
import TriageDashboard from "@/views/TriageDashboard.vue";
import CorrectionEditorView from "@/views/CorrectionEditorView.vue";
import LogDashboardView from "@/views/LogDashboardView.vue";
import AedAdminView from "@/views/AedAdminView.vue";
// *** ADDED IMPORTS FOR NEW ADMIN VIEWS ***
import HubRulesView from "@/views/HubRulesView.vue";
import AddressUploadView from "@/views/AddressUploadView.vue";
import OrderAdminView from "@/views/admin/OrderAdminView.vue"; // *** ADDED (REQ 2) ***
import { AuthGuard } from "@/router/AuthGuard";
import { EditorRouteGuard } from "@/router/EditorRouteGuard";
import { AuthSessionService } from "@/services/AuthSessionService";

/**
 * ARCHITECTURE: Creates the Vue Router with guards for authentication and editor prerequisites.
 * REFACTORED: Added routes for Hub Rules, Address Upload, AED SFTP Admin. Corrected admin role check.
 * UPDATED (REQ 2): Added new admin route for /admin/orders.
 */
export function createRouter(geoRuntime) { // GeoRuntime must be passed from main.js
  if (!geoRuntime) throw new Error("createRouter requires a GeoRuntime instance.");

  const editorGuard = new EditorRouteGuard(geoRuntime);
  const authGuard = new AuthGuard();
  const authSession = new AuthSessionService();
  // For role checking

  const routes = [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: LoginView },

    // Protected routes
    { path: "/dashboard", name: "dashboard", component: TriageDashboard, meta: { requiresAuth: true } },
    { path: "/worklist", name: "worklist", component: WorklistView, meta: { requiresAuth: true } },
    {
      path: "/editor/:id",
      name: "editor",
      component: CorrectionEditorView,
      meta: { requiresAuth: true }, // Editor requires auth
      beforeEnter: async (to, _from, next) => {
        try {
          // Check if geo providers are ready *before* allowing entry
          await editorGuard.canEnter(to);
          next(); // Proceed if guard passes
        } catch (guardError) {
          console.error("EditorRouteGuard failed:", guardError?.message || guardError);
          // Redirect back to worklist with an error query param
          next({ path: "/worklist", query: { error: 'editor_unavailable', reason: guardError?.message || 'Unknown' }});
        }
      },
    },
    // Admin routes grouped under /admin
    {
      path: "/admin/logs",
      name: "log-dashboard",
      component: LogDashboardView,
      meta: { requiresAuth: true, requiresAdmin: true } // Requires admin
    },
    {
      path: "/admin/hub-rules", // New route for Hub Rules
      name: "hub-rules",
      component: HubRulesView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: "/admin/address-upload", // New route for Address Upload
      name: "address-upload",
      component: AddressUploadView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: "/admin/aed-sftp", // New route for AED SFTP Admin
      name: "aed-admin",
      component: AedAdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // *** ADDED (REQ 2) ***
    {
      path: "/admin/orders",
      name: "admin-orders",
      component: OrderAdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // *** END ADDED (REQ 2) ***

    // Catch-all redirect (redirects unauthenticated to login, authenticated to dashboard)
    {
      path: "/:pathMatch(.*)*",
      redirect: to => {
        // Use session service to check current auth state without async call
        return authSession.isAuthenticated() ? '/dashboard' : '/login';
      }
    },
  ];

  const router = vueCreateRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
  });

  // Global Navigation Guard
  router.beforeEach(async (to, from, next) => {
    // 1. Skip auth checks for the login page itself
    if (to.path === '/login') {
      // If already authenticated, redirect away from login to dashboard
      if (authSession.isAuthenticated()) {
        next('/dashboard');
      } else {
        next(); // Allow access to login if not authenticated
      }
      return;
    }

    // 2. Check if the route requires authentication
    if (to.meta.requiresAuth || to.meta.requiresAdmin) {
      try {
        // Verify authentication using the AuthGuard
        await authGuard.canEnter(to); // This throws if not authenticated

        // 3. Check for Admin role if required
        if (to.meta.requiresAdmin && !authSession.hasRole('ADMIN')) {
          console.warn("AuthGuard: Admin role required for", to.path, ". User roles:", authSession.getUser()?.roles, "Redirecting to dashboard.");
          next("/dashboard"); // Redirect non-admins trying to access admin pages
          return;
        }

        // Authentication and Authorization passed
        next();
      } catch (authError) {
        // AuthGuard failed (not authenticated or token invalid)
        console.warn("AuthGuard failed:", authError?.message || authError, "Redirecting to login.");
        // Redirect to login, preserving the intended destination
        next({ path: "/login", query: { redirect: to.fullPath } });
      }
    } else {
      // Route does not require authentication
      next();
    }
  });

  return router;
}