<template>
  <div class="address-display p-4 bg-gray-50 rounded-lg border border-gray-200">
    <h3 v-if="title" class="text-sm font-semibold text-gray-700 mb-2">{{ title }}</h3>
    <div v-if="alias" class="alias-display mb-2">
      <span class="text-xs font-medium text-gray-500 uppercase">Alias:</span>
      <span class="ml-2 font-mono text-sm text-blue-600">{{ alias }}</span>
    </div>
    <pre v-if="address" class="text-xs font-mono text-gray-800 p-3 bg-white rounded border border-gray-200">{{ formattedAddress }}</pre>
    <p v-else class="na-text text-sm text-gray-500 italic">N/A</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  title: String,
  address: Object, // Expects Address-like object
  alias: String,   // Added alias prop
});
const formattedAddress = computed(() => {
  if (!props.address) return "N/A";
  try {
    // Create a copy for display, remove alias/name if it exists
    const displayObj = {...props.address};
    delete displayObj.alias;
    delete displayObj.name;

    return JSON.stringify(displayObj, null, 2);
  } catch {
    return "Invalid Address Data";
  }
});
</script>

<style scoped>
/* Scoped styles are minimal as Tailwind is used */
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>