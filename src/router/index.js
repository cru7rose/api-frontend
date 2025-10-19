/**
 * ARCHITECTURE: router/index defines minimal, safe routes so the shell always renders something.
 * It follows the manifesto by isolating guards and keeping route table deterministic.
 * Responsibilities:
 * - Provide /login, /worklist, /dashboard, /editor/:id; redirect / → /login to make the test obvious.
 */
import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import WorklistView from "@/views/WorklistView.vue";
import TriageDashboard from "@/views/TriageDashboard.vue";
import CorrectionEditorView from "@/views/CorrectionEditorView.vue";
import { AuthGuard } from "@/router/AuthGuard";
import { EditorRouteGuard } from "@/router/EditorRouteGuard";

export function createRouterWithKey(googleApiKey) {
  const editorGuard = new EditorRouteGuard(googleApiKey);
  const authGuard = new AuthGuard();

  const routes = [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: LoginView },
    { path: "/worklist", name: "worklist", component: WorklistView },
    { path: "/dashboard", name: "dashboard", component: TriageDashboard },
    {
      path: "/editor/:id",
      name: "editor",
      component: CorrectionEditorView,
      beforeEnter: async (to, _from, next) => {
        try { await editorGuard.canEnter(to); next(); } catch { next("/worklist"); }
      },
    },
    { path: "/:pathMatch(.*)*", redirect: "/login" },
  ];

  const router = createRouter({ history: createWebHistory(), routes });

  router.beforeEach(async (to, _from, next) => {
    try { await authGuard.canEnter(to); next(); }
    catch { next({ path: "/login", query: { r: to.fullPath } }); }
  });

  return router;
}