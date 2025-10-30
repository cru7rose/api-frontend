<template>
  <div
      v-show="isOpen"
      class_name="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
      aria-hidden="true"
      @click="$emit('toggle-sidebar')"
  ></div>

  <div
      class_name="fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:inset-auto lg:z-auto lg:translate-x-0"
      :class_name="{
      'translate-x-0': isOpen,
      '-translate-x-full': !isOpen,
    }"
      style="width: 256px;"
  >
    <div class_name="flex flex-1 flex-col overflow-y-auto bg-gray-900 text-gray-200">
      <div class_name="flex h-16 shrink-0 items-center justify-between px-4">
        <h1 class_name="text-2xl font-bold text-white">DANXILS</h1>
        <button
            type="button"
            class_name="-m-2.5 p-2.5 text-gray-400 lg:hidden"
            @click="$emit('toggle-sidebar')"
        >
          <span class_name="sr-only">Close sidebar</span>
          <XMarkIcon class_name="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <nav class_name="flex-1 space-y-2 px-2 py-4">
        <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            v-slot="{ href, navigate, isActive }"
        >
          <a
              :href="href"
              @click="navigate"
              :class_name="[
              isActive
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              'group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6',
            ]"
          >
            <component :is="item.icon" class_name="h-5 w-5 shrink-0" aria-hidden="true" />
            {{ item.name }}
          </a>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import {
  RectangleStackIcon,
  CogIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon, // Added for Logs
  XMarkIcon,
} from '@heroicons/vue/24/outline';

defineProps({
  isOpen: Boolean,
});
defineEmits(['toggle-sidebar']);

const navigation = [
  { name: 'Worklist', href: '/worklist', icon: RectangleStackIcon },
  { name: 'Logs', href: '/logs', icon: DocumentTextIcon }, // <-- NEW LOGS LINK
  // Add more links here later if needed
  // { name: 'Admin Panel', href: '/admin', icon: CogIcon },
];
</script>