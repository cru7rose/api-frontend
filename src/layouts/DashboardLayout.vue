<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
};

// Podstawowa nawigacja na podstawie router/index.js
const adminNavLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Change Password', path: '/dashboard/change-password' },
  { name: 'Order Statuses', path: '/dashboard/order-statuses' },
  { name: 'Rejected Requests', path: '/dashboard/rejected-requests', admin: true },
  { name: 'Status Export', path: '/dashboard/status-export', admin: true },
  { name: 'Address Providers', path: '/dashboard/admin/address-providers', admin: true },
  { name: 'Recently Added', path: '/dashboard/recently-added-addresses', admin: true },
  { name: 'Address Upload', path: '/dashboard/admin/address-upload', admin: true },
  { name: 'HUB Invoicing Rules', path: '/dashboard/hub-invoicing-rules', admin: true },
];

</script>

<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <aside class="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
      <div class="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
        Admin Panel
      </div>
      <nav class="flex-1 px-4 py-4 space-y-2">
        <template v-for="link in adminNavLinks" :key="link.path">
            <router-link
              v-if="!link.admin || authStore.isAdmin"
              :to="link.path"
              class="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              active-class="bg-gray-900"
            >
              {{ link.name }}
            </router-link>
        </template>
      </nav>
      <div class="px-4 py-4 border-t border-gray-700">
        <div class="text-sm text-gray-400 mb-2">Logged in as: <strong>{{ authStore.username }}</strong></div>
        <button
          @click="handleLogout"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles for the layout */
.router-link-exact-active {
  background-color: #1a202c; /* bg-gray-900 */
}
</style>