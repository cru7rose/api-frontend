/**
 * ARCHITECTURE: router/index.js defines routes and applies authentication + editor readiness guards.
 * It follows the manifesto by isolating navigation rules and prereq checks from the views.
 * Responsibilities:
 * - Register routes: /login, /dashboard, /worklist, /editor/:id.
 * - Apply global AuthGuard, and per-route EditorRouteGuard for /editor.
 */
import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import WorklistView from "@/views/WorklistView.vue";
import CorrectionEditorView from "@/views/CorrectionEditorView.vue";
import TriageDashboard from "@/views/TriageDashboard.vue";
import { EditorRouteGuard } from "@/router/EditorRouteGuard";
import { AuthGuard } from "@/router/AuthGuard";

export function createRouterWithKey(googleApiKey) {
  const editorGuard = new EditorRouteGuard(googleApiKey);
  const authGuard = new AuthGuard();
  const routes = [
    { path: "/", redirect: "/worklist" },
    { path: "/login", name: "login", component: LoginView },
    { path: "/dashboard", name: "dashboard", component: TriageDashboard },
    { path: "/worklist", name: "worklist", component: WorklistView },
    {
      path: "/editor/:id",
      name: "editor",
      component: CorrectionEditorView,
      beforeEnter: async (to, _from, next) => {
        try { await editorGuard.canEnter(to); next(); } catch { next("/worklist"); }
      },
    },
    { path: "/:pathMatch(.*)*", redirect: "/worklist" },
  ];
  const router = createRouter({ history: createWebHistory(), routes });
  router.beforeEach(async (to, from, next) => {
    try { await authGuard.canEnter(to); next(); } catch { next({ path: "/login", query: { r: to.fullPath } }); }
  });
  return router;
}
