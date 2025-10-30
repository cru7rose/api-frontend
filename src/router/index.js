// ============================================================================
// router/index.js — adds meta.hideShell for /login and consistent guards
// ============================================================================
import { createRouter as createVueRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import WorklistView from "@/views/WorklistView.vue";
import CorrectionEditorView from "@/views/CorrectionEditorView.vue";
import LoginView from "@/views/LoginView.vue";
import LogsView from "@/views/LogsView.vue";

export const createRouter = () => {
  const routes = [
    { path: "/login", name: "login", component: LoginView, meta: { hideShell: true } },
    { path: "/", redirect: "/worklist" },
    { path: "/worklist", name: "worklist", component: WorklistView, meta: { requiresAuth: true } },
    { path: "/editor/:id", name: "editor", component: CorrectionEditorView, meta: { requiresAuth: true } },
    { path: "/logs", name: "logs", component: LogsView, meta: { requiresAuth: true, requiresAdmin: true } },
  ];

  const router = createVueRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });

  router.beforeEach((to, _from, next) => {
    const auth = useAuthStore();
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      auth.setRedirect(to.fullPath);
      return next({ name: "login" });
    }
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return next({ name: "worklist" });
    }
    return next();
  });

  return router;
};
