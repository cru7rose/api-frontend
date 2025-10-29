<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const isAdmin = computed(() => user.value?.roles?.includes('ADMIN'));

</script>

<template>
  <aside class="sidebar-nav">
    <nav>
      <ul>
        <li><router-link to="/dashboard"><i class="icon icon-dashboard"></i> Dashboard</router-link></li>
        <li><router-link to="/worklist"><i class="icon icon-list"></i> Worklist</router-link></li>
        <li v-if="isAdmin"><router-link to="/admin/logs"><i class="icon icon-file-text"></i> Logs</router-link></li>
        <li v-if="isAdmin"><router-link to="/admin/aed-sftp"><i class="icon icon-server"></i> AED SFTP</router-link></li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-nav {
  width: 240px;
  background-color: #f8f9fa; /* Light background for sidebar */
  border-right: 1px solid var(--color-border);
  padding: calc(var(--spacing-unit) * 2);
  height: calc(100vh - 60px); /* Full height minus header */
  position: sticky; /* Make sidebar stick */
  top: 60px; /* Position below header */
  overflow-y: auto; /* Allow scrolling if content overflows */
  flex-shrink: 0; /* Prevent sidebar from shrinking */
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

nav li {
  margin-bottom: var(--spacing-unit);
}

nav a {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing-unit)) calc(var(--spacing-unit) * 1.5);
  border-radius: 4px;
  color: var(--color-text);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

nav a i {
  margin-right: var(--spacing-unit);
  /* Basic icon styling - replace with actual icon font/SVG setup */
  display: inline-block;
  width: 16px;
  height: 16px;
  /* background: gray; */ /* Placeholder */
}

nav a:hover {
  background-color: var(--color-border);
}

nav a.router-link-exact-active {
  background-color: var(--color-primary);
  color: white;
  font-weight: 500;
}
/* Basic icon placeholders - you'll need an icon library like Feather Icons */
.icon-dashboard::before { content: '📊'; }
.icon-list::before { content: '📋'; }
.icon-file-text::before { content: '📄'; }
.icon-server::before { content: '☁️'; }


</style>