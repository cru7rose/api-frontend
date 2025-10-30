import { createRouter as createVueRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

import WorklistView from '@/views/WorklistView.vue';
import CorrectionEditorView from '@/views/CorrectionEditorView.vue';
import LoginView from '@/views/LoginView.vue';
import LogsView from '@/views/LogsView.vue';
import ShowcasePro from '@/views/ShowcasePro.vue';

export const createRouter = () => {
  const routes = [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, hideShell: true } }, // 👈
    { path: '/', redirect: '/worklist' },

    { path: '/worklist', name: 'worklist', component: WorklistView, meta: { requiresAuth: true } },
    { path: '/editor/:id', name: 'editor', component: CorrectionEditorView, meta: { requiresAuth: true } },
    { path: '/logs', name: 'logs', component: LogsView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/pro', name: 'showcase-pro', component: ShowcasePro, meta: { requiresAuth: true } },

    { path: '/:pathMatch(.*)*', redirect: '/worklist' },
  ];

  const router = createVueRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ top: 0 }),
  });

  router.beforeEach((to, _from, next) => {
    const auth = useAuthStore();
    if (to.meta.public) return next();
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      auth.setRedirect?.(to.fullPath);
      return next({ name: 'login' });
    }
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return next({ name: 'worklist' });
    }
    return next();
  });

  return router;
};
