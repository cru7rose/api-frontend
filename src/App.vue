<script setup>
import { computed, ref, watch, provide, readonly } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { storeToRefs } from "pinia";
import SidebarNav from '@/components/layout/SidebarNav.vue'; // *** IMPORT SIDEBAR ***

// Basic global notification state (can be expanded)
const notification = ref({ show: false, message: '', type: 'info' }); // type: info, success, warning, error
const showNotification = (message, type = 'info', duration = 3000) => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, duration);
};
provide('showNotification', showNotification); // Make available globally

const authStore = useAuthStore();
const { isAuthenticated, user } = storeToRefs(authStore);
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
  showNotification('Logged out successfully.', 'success');
};

const userInitial = computed(() => user.value?.username?.charAt(0)?.toUpperCase() || '?');

// Watch for authentication changes to potentially redirect
watch(isAuthenticated, (isAuth, oldAuth) => {
  // Only redirect if state changes from authenticated to not authenticated
  // and we are not already on the login page
  if (oldAuth === true && isAuth === false && router.currentRoute.value.path !== '/login') {
    router.push('/login');
  }
}, { immediate: false }); // Don't run immediately on load

// Provide readonly auth state for components that just need to read it
provide('isAuthenticated', readonly(isAuthenticated));
provide('currentUser', readonly(user));

</script>

<template>
  <div class="app-layout">
    <header class="app-header" v-if="isAuthenticated">
      <div class="header-content">
        <div class="logo">DANXILS Triage</div>
        <div class="user-info">
          <span class="user-initial">{{ userInitial }}</span>
          <span class="username">{{ user?.username }}</span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </div>
    </header>

    <div class="app-body">
      <SidebarNav v-if="isAuthenticated" />

      <main class="app-content">
        <RouterView />
      </main>
    </div>


    <div v-if="notification.show" :class="['notification-banner', `notification-${notification.type}`]">
      {{ notification.message }}
    </div>

  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--color-primary);
  color: white;
  padding: 0 calc(var(--spacing-unit) * 2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky; /* Keep header visible */
  top: 0;
  z-index: 1000;
  height: 60px; /* Fixed header height */
}

.header-content {
  max-width: 100%; /* Allow header content to span full width */
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  justify-content: space-between; /* Push logo left, user info right */
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
}

/* Main nav removed */

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-unit);
}

.user-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-secondary);
  color: var(--color-primary);
  font-weight: bold;
  margin-right: calc(var(--spacing-unit));
}

.username {
  font-weight: 500;
}

.logout-button {
  background: none;
  border: 1px solid white;
  color: white;
  padding: calc(var(--spacing-unit) * 0.5) var(--spacing-unit);
  border-radius: 4px;
  cursor: pointer;
  margin-left: calc(var(--spacing-unit) * 2);
}
.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* *** NEW: Body Layout with Sidebar *** */
.app-body {
  display: flex;
  flex-grow: 1; /* Take remaining height */
  overflow: hidden; /* Prevent body scroll */
}

.app-content {
  flex-grow: 1;
  padding: calc(var(--spacing-unit) * 3); /* Add padding around main content */
  overflow-y: auto; /* Allow content area to scroll */
  height: calc(100vh - 60px); /* Full height minus header */
}
/* *** END NEW *** */

/* Notification Banner Styles */
.notification-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 25px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  min-width: 250px;
  text-align: center;
}
.notification-info { background-color: var(--color-info); }
.notification-success { background-color: var(--color-success); }
.notification-warning { background-color: var(--color-warning); color: var(--color-text); } /* Yellow needs dark text */
.notification-error { background-color: var(--color-danger); }

</style>