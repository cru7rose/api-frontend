<template>
  <header class_name="relative flex h-16 shrink-0 items-center justify-between bg-white dark:bg-gray-800 shadow-sm z-30">
    <button
        type="button"
        class_name="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
        @click="$emit('toggle-sidebar')"
    >
      <span class_name="sr-only">Open sidebar</span>
      <Bars3Icon class_name="h-6 w-6" aria-hidden="true" />
    </button>

    <div class_name="flex-1"></div>

    <div class_name="flex items-center gap-x-4 pr-4 sm:pr-6">
      <Menu as="div" class_name="relative">
        <MenuButton class_name="-m-1.5 flex items-center p-1.5">
          <span class_name="sr-only">Open user menu</span>
          <UserCircleIcon class_name="h-7 w-7 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <span class_name="hidden lg:flex lg:items-center">
            <span class_name="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100" aria-hidden="true">
              {{ auth.username || 'User' }}
            </span>
            <ChevronDownIcon class_name="ml-1 h-4 w-4 text-gray-500" aria-hidden="true" />
          </span>
        </MenuButton>
        <transition
            enter-active-class_name="transition ease-out duration-100"
            enter-from-class_name="transform opacity-0 scale-95"
            enter-to-class_name="transform opacity-100 scale-100"
            leave-active-class_name="transition ease-in duration-75"
            leave-from-class_name="transform opacity-100 scale-100"
            leave-to-class_name="transform opacity-0 scale-95"
        >
          <MenuItems
              class_name="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <button
                  @click="handleLogout"
                  :class_name="[
                  active ? 'bg-gray-100 dark:bg-gray-600' : '',
                  'block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-100',
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
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import {
  Bars3Icon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';

const auth = inject('auth');
const router = useRouter();

defineEmits(['toggle-sidebar']);

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>