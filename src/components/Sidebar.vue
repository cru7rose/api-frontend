<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-800 text-slate-100 transition-all duration-300 ease-in-out print:hidden"
    :class="isOpen ? 'w-64' : 'w-16 items-center'"
  >
    <div class="flex items-center justify-center h-16 flex-shrink-0 border-b border-slate-700">
      <router-link to="/dashboard" class="flex items-center justify-center">
        <div v-if="isOpen" class="text-xl font-bold text-white tracking-wider">DANXILS</div>
        <div v-else class="text-xl font-bold text-white">DX</div>
      </router-link>
    </div>

    <nav class="flex-1 overflow-y-auto overflow-x-hidden">
      <ul class="flex flex-col py-4 space-y-1">
        <li>
          <router-link to="/dashboard" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span :class="textClasses">Dashboard</span>
          </router-link>
        </li>
        <li>
          <router-link to="/order-statuses" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            <span :class="textClasses">Order Statuses</span>
          </router-link>
        </li>

        <template v-if="authStore.isAdmin">
          <li class="px-4 pt-4 pb-2">
            <span :class="isOpen ? 'text-xs font-semibold text-slate-400 uppercase' : 'hidden'">
              Administration
            </span>
          </li>
          <li>
            <router-link to="/hub-invoicing-rules" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span :class="textClasses">HUB Invoicing Rules</span>
            </router-link>
          </li>
          <li>
            <router-link to="/client-invoicing-rules" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span :class="textClasses">Client Invoicing Rules</span>
            </router-link>
          </li>
          <li>
            <router-link to="/rejected-requests" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
             <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              <span :class="textClasses">Rejected Requests</span>
            </router-link>
          </li>
        </template>
        
      </ul>
    </nav>

    <div class="flex-shrink-0 border-t border-slate-700">
      <router-link to="/change-password" class="flex items-center py-2 px-4 space-x-3 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-200">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 0110.257-4.95zM15 7a2 2 0 00-2-2H9a2 2 0 00-2 2" /></svg>
        <span :class="textClasses">Change Password</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const authStore = useAuthStore();

const textClasses = computed(() => {
  return props.isOpen ? 'opacity-100 transition-opacity duration-200' : 'opacity-0 w-0 h-0';
});
</script>

<style>
/* Add these styles to your main CSS file, e.g., main.css, to style the active link */
.router-link-exact-active {
  @apply bg-slate-900 text-white;
}
</style>