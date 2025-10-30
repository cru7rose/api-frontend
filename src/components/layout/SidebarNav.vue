<template>
  <aside class="w-60 bg-white border-r border-slate-200 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
    <nav class="p-4 space-y-1">
      <RouterLink to="/dashboard" class="nav-link">
        <span class="i">📊</span><span>Dashboard</span>
      </RouterLink>
      <RouterLink to="/worklist" class="nav-link">
        <span class="i">📋</span><span>Worklist</span>
      </RouterLink>
      <RouterLink v-if="isAdmin" to="/logs" class="nav-link">
        <span class="i">📄</span><span>Logs</span>
      </RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/aed-sftp" class="nav-link">
        <span class="i">☁️</span><span>AED SFTP</span>
      </RouterLink>
      <RouterLink to="/pro" class="nav-link">
        <span class="i">✨</span><span>Yellow–Blue Showcase</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.roles?.includes('ADMIN'));
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-slate-700;
}
.nav-link:hover {
  /* blue hover with subtle yellow halo */
  background: linear-gradient(0deg, rgba(250,204,21,0.18), rgba(250,204,21,0.18)), #fff; /* yellow-400@18% over white */
  outline: 1px solid rgba(37,99,235,0.25); /* blue-600@25% */
}
.nav-link.router-link-active {
  background: linear-gradient(0deg, rgba(37,99,235,0.10), rgba(37,99,235,0.10)), #fff;
  color: #1d4ed8; /* blue-700 */
  box-shadow: 0 0 0 2px #facc15 inset; /* yellow-400 ring */
}
.i { width: 1.25rem; text-align: center; }
</style>
