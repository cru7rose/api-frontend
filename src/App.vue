<template>
  <div class_name="flex h-screen bg-gray-100 dark:bg-gray-900">
    <Sidebar :is-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class_name="flex-1 flex flex-col overflow-hidden">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class_name="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <Notification />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import Sidebar from '@/components/Sidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import Notification from '@/components/Notification.vue';
import { useNotificationStore } from '@/stores/notification.js';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// --- Sidebar State ---
// Start open on desktop, closed on mobile
const sidebarOpen = ref(window.innerWidth >= 1024);

// --- Provide global utilities ---
// This replaces the old 'showNotification' from main.js
provide('showNotification', (message, type = 'info', duration = 5000) => {
  notificationStore.show(message, type, duration);
});

onMounted(() => {
  authStore.checkAuth();

  // Handle dark mode from user's OS preference
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<style scoped>
/* Simple fade transition for router-view */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>