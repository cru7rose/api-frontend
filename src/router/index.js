// ============================================================================
// Frontend: Update router/index.js
// FILE: src/router/index.js
// REASON: Add the new /logs route.
// ============================================================================
import { createRouter as createVueRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import WorklistView from '@/views/WorklistView.vue';
import CorrectionEditorView from '@/views/CorrectionEditorView.vue';
import LoginView from '@/views/LoginView.vue';
import LogsView from '@/views/LogsView.vue'; // <-- IMPORT NEW VIEW

export const createRouter = (geoRuntime) => {
  const routes = [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      redirect: '/worklist',
    },
    {
      path: '/worklist',
      name: 'worklist',
      component: WorklistView,
      meta: { requiresAuth: true },
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: CorrectionEditorView,
      meta: { requiresAuth: true },
    },
    // *** NEW ROUTE FOR LOGS ***
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
      meta: { requiresAuth: true, requiresAdmin: true }, // Protected route
    },
    // *** END NEW ROUTE ***
  ];

  const router = createVueRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });

  // Navigation Guard
  router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      auth.setRedirect(to.fullPath);
      return next({ name: 'login' });
    }

    if (to.meta.requiresAdmin && !auth.isAdmin) {
      // If user is not admin, redirect to worklist
      return next({ name: 'worklist' });
    }

    return next();
  });

  return router;
};