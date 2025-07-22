<template>
  <div class="min-h-screen bg-slate-100 flex antialiased">
    <Sidebar :is-open="isSidebarEffectivelyOpen" @toggle-sidebar="toggleSidebarPreference" />

    <div
      class="flex-1 flex flex-col transition-all duration-300 ease-in-out"
      :style="{ 'margin-left': contentMarginLeft }"
    >
      <header class="bg-white shadow-sm sticky top-0 z-30 print:hidden">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <button
                @click="toggleSidebarPreference"
                class="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-2 -ml-2 rounded-md"
                aria-label="Toggle sidebar"
              >
                <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div class="flex items-center">
              <span class="text-sm text-slate-700 mr-3 hidden sm:block">
                Witaj, {{ authStore.user?.username || 'Użytkowniku' }}
              </span>
              <button
                @click="performUserLogout"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500 p-2 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>

      <footer class="bg-slate-100 text-center p-4 border-t border-slate-200 text-xs text-slate-500 print:hidden">
        &copy; {{ new Date().getFullYear() }} Danxils Enterprise System
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const screenWidth = ref(window.innerWidth);
const userPrefersSidebarOpen = ref(true); // Preferencja użytkownika (np. z localStorage)

const isLargeScreen = computed(() => screenWidth.value >= 1024); // lg breakpoint

const isSidebarEffectivelyOpen = computed(() => {
  // Na małych ekranach, sidebar jest mobilnym overlayem, jego "otwarcie" jest kontrolowane przez userPrefersSidebarOpen
  // Na dużych ekranach, sidebar jest zawsze "obecny" (albo szeroki albo wąski), kontrolowany przez userPrefersSidebarOpen
  return userPrefersSidebarOpen.value;
});

const sidebarCollapsedWidth = '4rem'; // 64px (w-16)
const sidebarExpandedWidth = '16rem'; // 256px (w-64)

const contentMarginLeft = computed(() => {
  if (isLargeScreen.value) {
    // Na dużych ekranach, content ma margines w zależności od stanu sidebara
    return userPrefersSidebarOpen.value ? sidebarExpandedWidth : sidebarCollapsedWidth;
  }
  // Na małych ekranach, sidebar jest nakładką (fixed, absolute), więc content nie potrzebuje marginesu
  return '0px';
});

const toggleSidebarPreference = () => {
  userPrefersSidebarOpen.value = !userPrefersSidebarOpen.value;
  if (isLargeScreen.value) {
    localStorage.setItem('sidebarUserPrefersOpen', JSON.stringify(userPrefersSidebarOpen.value));
  }
};

const performUserLogout = () => {
  authStore.logout();
  router.push('/login');
};

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
  // Dostosuj domyślny stan sidebara przy zmianie rozmiaru ekranu, jeśli preferencja nie była ustawiona
  if (localStorage.getItem('sidebarUserPrefersOpen') === null) {
    if (isLargeScreen.value) {
      userPrefersSidebarOpen.value = true; // Domyślnie otwarty na dużych
    } else {
      userPrefersSidebarOpen.value = false; // Domyślnie zamknięty na małych
    }
  }
};

onMounted(() => {
  const storedPreference = localStorage.getItem('sidebarUserPrefersOpen');
  if (storedPreference !== null) {
    userPrefersSidebarOpen.value = JSON.parse(storedPreference);
  } else {
    // Ustaw domyślny stan na podstawie początkowej szerokości ekranu
    userPrefersSidebarOpen.value = isLargeScreen.value;
  }
  window.addEventListener('resize', updateScreenWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth);
});
</script>

<style scoped>
.flex-1 {
  transition: margin-left 0.25s ease-in-out;
}
</style>