// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { useAuthStore } from '@/stores/authStore';

const routes = [
    // --- POCZĄTEK POPRAWKI ---
    // Przekierowanie ze strony głównej prosto do panelu
    { path: '/', redirect: '/dashboard' }, 
    
    // "Pułapka" na błędne przekierowanie - jeśli cokolwiek przekieruje na /websites_Overview,
    // zostanie to natychmiast naprawione i przekierowane do /dashboard
    { path: '/websites_Overview', redirect: '/dashboard' },
    // --- KONIEC POPRAWKI ---

    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    // Usunęliśmy starą ścieżkę dla '/', ponieważ teraz jest to przekierowanie

    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'change-password', name: 'changePassword', component: () => import('@/views/ChangePasswordView.vue') },
        {
          path: 'rejected-requests',
          name: 'rejectedRequests',
          component: () => import('@/views/RejectedRequestsView.vue'),
          meta: { roles: ['ADMIN'] }
        },
        {
          path: 'order-statuses',
          name: 'orderStatuses',
          component: () => import('@/views/OrderStatusView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'admin/address-providers',
          name: 'adminAddressProviders',
          component: () => import('@/views/admin/AddressProvidersView.vue'),
          meta: { roles: ['ADMIN'] }
        }
      ]
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue') }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Reszta pliku bez zmian...
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRoles = to.matched.find(record => record.meta.roles)?.meta.roles;

    if (requiresAuth && !authStore.isLoggedIn) {
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else if (to.name === 'login' && authStore.isLoggedIn) {
        next({ name: 'dashboard' });
    } else if (requiresAuth && requiredRoles && !requiredRoles.some(role => authStore.userHasRole(role))) {
        console.warn(`User ${authStore.user?.username} does not have required roles: ${requiredRoles} for route ${to.name}`);
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router;