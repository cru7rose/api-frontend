<script setup>
defineProps({
  label: String,
  disabled: Boolean,
  title: String
});
defineEmits(['click']);
</script>

<template>
  <button
      :disabled="disabled"
      :title="title"
      @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
/* Inherits .button and .button.secondary styles from theme.css */
button {
  /* Ensure it picks up the base .button class styles */
  display: inline-block;
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease;
}
button:hover:not(:disabled) {
  background-color: #004477; /* Darker blue */
}
button.secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}
button.secondary:hover:not(:disabled) {
  background-color: #e0a800; /* Darker yellow */
}
button:disabled {
  background-color: var(--color-border);
  color: var(--color-text-light);
  cursor: not-allowed;
}
</style>