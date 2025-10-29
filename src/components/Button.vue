<script setup>
const props = defineProps({
  label: String,
  variant: {
    type: String,
    default: 'primary'
  },
  iconLeft: String,
  iconRight: String,
  disabled: Boolean,
  to: [String, Object]
});
</script>

<template>
  <component :is="to ? 'router-link' : 'button'" :to="to"
             :disabled="disabled"
             :class="{
      'bg-blue-600 hover:bg-blue-700 text-white': variant === 'primary' && !disabled,
      'bg-gray-200 hover:bg-gray-300 text-gray-700': variant === 'secondary' && !disabled,
      'bg-red-600 hover:bg-red-700 text-white': variant === 'danger' && !disabled,
      'bg-yellow-600 hover:bg-yellow-700 text-white': variant === 'warning' && !disabled,
      'bg-gray-400 text-gray-700 cursor-not-allowed': disabled,
    }"
             class="px-4 py-2 rounded-lg font-medium transition duration-150 inline-flex items-center justify-center gap-2 text-sm"
  >
    <div v-if="iconLeft" :class="iconLeft"></div>
    {{ label }}
    <div v-if="iconRight" :class="iconRight"></div>
  </component>
</template>
