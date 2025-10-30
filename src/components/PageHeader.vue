<template>
  <div class="border-b border-gray-200 dark:border-gray-700 pb-5">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:truncate sm:tracking-tight">
        {{ title }}
      </h2>
      <div class="mt-3 flex md:ml-4 md:mt-0">
        <slot name="actions"></slot>
      </div>
    </div>
    <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ subtitle }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>