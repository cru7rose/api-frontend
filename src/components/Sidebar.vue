// Fragment z src/components/Sidebar.vue
<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 transition-transform duration-300 ease-in-out shadow-xl print:hidden"
    :class="isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-16'"
    aria-label="Sidebar"
  >
    <div 
      class="flex items-center h-16 px-4 border-b border-slate-700 shrink-0"
      :class="isOpen ? 'justify-between' : 'justify-center'"
    >
      <router-link to="/dashboard" class="text-xl font-bold text-white whitespace-nowrap" v-if="isOpen">
        Danxils Panel
      </router-link>
      <router-link to="/dashboard" class="text-white" v-else>
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 16v-2m0-10v2M6 12H4m16 0h-2m-10 0h2m4 4l2-2m-4-4l2-2m4 4l-2-2m-4-4l-2-2"></path></svg>
      </router-link>
      <button @click="$emit('toggle-sidebar')" class="text-slate-400 hover:text-white lg:hidden p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-white" v-if="isOpen">
         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <nav class="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
      <SidebarLink to="/dashboard" icon-class="home" :is-open="isOpen">Dashboard</SidebarLink>

     <SidebarLink
        v-if="authStore.userHasRole('ADMIN')"
        to="/dashboard/rejected-requests" icon-class="exclamation-triangle"
        :is-open="isOpen"
      >
        Odrzucone Żądania
      </SidebarLink>

      <SidebarLink
        v-if="authStore.userHasRole('ADMIN')"
        to="/dashboard/admin/address-providers"
        icon-class="cog-6-tooth" :is-open="isOpen"
      >
        Dostawcy Adresów
      </SidebarLink>

      <SidebarLink
        to="/dashboard/order-statuses" icon-class="list-ul"
        :is-open="isOpen"
      >
        Statusy Zamówień
      </SidebarLink>

      <div class="pt-4 mt-4 space-y-1 border-t border-slate-700">
        <SidebarLink to="/dashboard/change-password" icon-class="key" :is-open="isOpen">Zmień Hasło</SidebarLink> <button
          @click="handleUserLogout"
          class="w-full flex items-center px-2 py-2.5 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 hover:text-white group transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :title="isOpen ? '' : 'Wyloguj'"
        >
          <component :is="getIcon('arrow-right-on-rectangle')" 
            class="flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-300 transition-colors" 
            :class="isOpen ? 'mr-3' : 'mx-auto'"
            aria-hidden="true" />
          <span v-if="isOpen" class="truncate">Wyloguj</span>
        </button>
      </div>
    </nav>

    <div class="p-4 mt-auto border-t border-slate-700 shrink-0" v-if="isOpen">
      <p class="text-xs text-slate-400 text-center">&copy; {{ new Date().getFullYear() }}</p>
    </div>
  </aside>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import SidebarLink from '@/components/SidebarLink.vue'; // Upewnij się, że ścieżka jest poprawna

defineProps({
  isOpen: Boolean,
});
const emit = defineEmits(['toggle-sidebar']);

const authStore = useAuthStore();
const router = useRouter();

const handleUserLogout = () => { // Zmieniono nazwę z handleLogout
  authStore.logout();
  router.push('/login');
};

const getIcon = (iconName) => {
  const icons = {
    'home': () => import('@heroicons/vue/24/outline/HomeIcon'),
    'exclamation-triangle': () => import('@heroicons/vue/24/outline/ExclamationTriangleIcon'),
    'key': () => import('@heroicons/vue/24/outline/KeyIcon'),
    'arrow-right-on-rectangle': () => import('@heroicons/vue/24/outline/ArrowRightOnRectangleIcon'),
    'list-ul': () => import('@heroicons/vue/24/outline/ListBulletIcon'),
    'cog-6-tooth': () => import('@heroicons/vue/24/outline/Cog6ToothIcon'), // DODAJ NOWĄ IKONĘ
  };
  return defineAsyncComponent(icons[iconName] || icons['home']); //
};
</script>

<style scoped>
aside {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.slate.600') theme('colors.slate.800');
  transition-property: width, transform; /* Dodaj transform do transition */
}
aside::-webkit-scrollbar {
  width: 6px;
}
aside::-webkit-scrollbar-track {
  background: theme('colors.slate.800');
}
aside::-webkit-scrollbar-thumb {
  background-color: theme('colors.slate.600');
  border-radius: 3px;
}
</style>