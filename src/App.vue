<template>
  <div class="flex h-screen bg-gray-50">

    <Sidebar :is-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="flex-1 flex flex-col overflow-hidden">

      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
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
import { ref, onMounted, provide, watch } from 'vue'; // Dodano watch dla tytułu
import { useRoute } from 'vue-router'; // Dodano useRoute dla tytułu
import { useAuthStore } from '@/stores/auth.js';
import Sidebar from '@/components/Sidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import Notification from '@/components/Notification.vue';
import { useNotificationStore } from '@/stores/notification.js';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute(); // <-- Użyj route

// --- Sidebar State ---
const sidebarOpen = ref(window.innerWidth >= 1024);

// --- Provide global utilities ---
provide('showNotification', (message, type = 'info', duration = 5000) => {
  notificationStore.show(message, type, duration);
});

onMounted(() => {
  authStore.checkAuth();

  // Basic color scheme preference check
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

// Dodano logikę do dynamicznej zmiany tytułu strony
watch(() => route.path, () => {
  const baseTitle = "DANXILS Triage";
  let pageName = route.name ? route.name.toString() : 'Application';

  if (pageName === 'worklist') pageName = 'Worklist';
  else if (pageName === 'logs') pageName = 'System Logs';
  else if (pageName === 'editor') pageName = `Editor: ${route.params.id || 'Loading'}`;

  document.title = `${pageName} | ${baseTitle}`;
}, { immediate: true });

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