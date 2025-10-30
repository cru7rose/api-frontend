<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- App shell (hidden on routes with meta.hideShell) -->
    <div v-if="showShell" class="flex h-screen">
      <SidebarNav />

      <div class="flex-1 flex flex-col overflow-hidden">
        <AppHeader @toggle-sidebar="toggleSidebar" />
        <main class="flex-1 overflow-x-hidden overflow-y-auto">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>

      <Notification />
    </div>

    <!-- Auth/public screens (e.g., /login) -->
    <div v-else>
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import AppHeader from '@/components/layout/AppHeader.vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import Notification from '@/components/Notification.vue'
import { useNotificationStore } from '@/stores/notification.js'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Provide Pinia auth for any legacy inject('auth') usages
provide('auth', authStore)

// Show shell on routes that don't explicitly hide it (e.g., /login has meta.hideShell)
const showShell = computed(() => !route.meta?.hideShell)

// Optional: hook up mobile/off-canvas behavior later
const isSidebarOpen = ref(true)
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }

provide('showNotification', (message, type = 'info', duration = 5000) => {
  notificationStore.show(message, type, duration)
})

onMounted(() => {
  authStore.checkAuth?.()
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && prefersDark)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
