<template>
  <div>
    <label :for="id" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">{{ label }}</label>
    <div class="mt-2">
      <input
          :type="type"
          :name="id"
          :id="id"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :disabled="disabled"
          :step="step"
          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:focus:ring-blue-500"
          :class="{ 'disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700/50': disabled }"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  id: String,
  type: {
    type: String,
    default: 'text'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  step: {
    type: String,
    default: 'any'
  }
});
defineEmits(['update:modelValue']);
</script>