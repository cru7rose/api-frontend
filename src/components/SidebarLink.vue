<template>
  <router-link
    :to="to"
    custom
    v-slot="{ href, navigate, isActive, isExactActive }"
  >
    <a
      :href="href"
      @click="navigate"
      class="flex items-center px-2 py-2.5 text-sm font-medium rounded-md group transition-colors"
      :class="[
        (isActive || isExactActive) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
        { 'justify-center': !isOpen }
      ]"
      :title="isOpen ? '' : $slots.default()[0].children"
    >
      <component
        :is="getIcon(iconClass)"
        class="flex-shrink-0 h-5 w-5 group-hover:text-white transition-colors"
        :class="[(isActive || isExactActive) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300', isOpen ? 'mr-3' : 'mx-auto']"
        aria-hidden="true"
      />
      <span v-if="isOpen" class="truncate"><slot></slot></span>
    </a>
  </router-link>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';

const props = defineProps({
  to: {
    type: [String, Object],
    required: true,
  },
  iconClass: {
    type: String,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: true,
  }
});

const getIcon = (iconName) => {
  const icons = {
    'home': () => import('@heroicons/vue/24/outline/HomeIcon'),
    'exclamation-triangle': () => import('@heroicons/vue/24/outline/ExclamationTriangleIcon'),
    'key': () => import('@heroicons/vue/24/outline/KeyIcon'),
    'list-ul': () => import('@heroicons/vue/24/outline/ListBulletIcon'),
  };
  return defineAsyncComponent(icons[iconName] || icons['home']);
};
</script>