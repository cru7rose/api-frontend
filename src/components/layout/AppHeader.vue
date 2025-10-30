<template>
  <header class="relative flex h-16 shrink-0 items-center justify-between bg-white shadow-sm z-30 border-b border-gray-200">
    <button
        type="button"
        class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        @click="$emit('toggle-sidebar')"
    >
      <span class="sr-only">Open sidebar</span>
      <Bars3Icon class="h-6 w-6" aria-hidden="true" />
    </button>

    <div class="flex-1"></div>

    <div class="flex items-center gap-x-4 pr-4 sm:pr-6">
      <Menu as="div" class="relative">
        <MenuButton class="-m-1.5 flex items-center p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <span class="sr-only">Open user menu</span>
          <UserCircleIcon class="h-7 w-7 text-blue-600" aria-hidden="true" />
          <span class="hidden lg:flex lg:items-center">
            <span class="ml-2 text-sm font-semibold text-gray-900" aria-hidden="true">
              {{ auth.username || 'User' }}
            </span>
            <ChevronDownIcon class="ml-1 h-4 w-4 text-gray-500" aria-hidden="true" />
          </span>
        </MenuButton>
        <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
              class="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <button
                  @click="handleLogout"
                  :class="[
                  active ? 'bg-amber-100 text-gray-900' : 'text-gray-700',
                  'block w-full px-4 py-2 text-left text-sm',
                ]"
              >
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>
  </header>
</template>

<script setup>
import {inject} from 'vue';
import {useRouter} from 'vue-router';
import {Menu, MenuButton, MenuItem, MenuItems} from '@headlessui/vue';
import {
  Bars3Icon,          // <-- Poprawny import dla Bars3Icon
  UserCircleIcon,     // <-- Poprawny import dla UserCircleIcon
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';
// Reszta logiki...
const auth = inject('auth');
const router = useRouter();

defineEmits(['toggle-sidebar']);
const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>