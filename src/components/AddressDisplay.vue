<template>
  <div class="address-display">
    <h3 v-if="title" class="text-sm font-semibold text-gray-700 mb-2">{{ title }} <span v-if="reasonCode" class="ml-2 font-mono text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{{ reasonCode }}</span></h3>
    <div v-if="alias" class="alias-display mb-2">
      <span class="text-xs font-medium text-gray-500 uppercase">Alias:</span>
      <span class="ml-2 font-mono text-sm text-blue-600">{{ alias }}</span>
    </div>

    <div v-if="address" class="p-3 bg-gray-50 rounded border border-gray-200">
      <pre class="text-xs font-mono text-gray-800">{{ formattedAddress }}</pre>
      <div v-if="address.latitude || address.longitude" class="mt-2 pt-2 border-t border-gray-200">
        <span class="text-xs font-mono text-blue-600">Lat: {{ address.latitude || 'N/A' }}, Lon: {{ address.longitude || 'N/A' }}</span>
      </div>
    </div>
    <p v-else class="na-text text-sm text-gray-500 italic p-3 bg-gray-50 rounded border border-gray-200">N/A</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  title: String,
  address: Object, // Expects Address-like object
  alias: String,
  reasonCode: String, // To display ALIAS_MISMATCH etc.
});
const formattedAddress = computed(() => {
  if (!props.address) return "N/A";
  try {
    // Create a copy for display, remove fields we show separately
    const displayObj = { ...props.address };
    delete displayObj.alias;
    delete displayObj.name;
    delete displayObj.latitude;
    delete displayObj.longitude;

    // Filter out null/empty values for a cleaner display
    Object.keys(displayObj).forEach(key => {
      if (displayObj[key] === null || displayObj[key] === "") {
        delete displayObj[key];
      }
    });

    return JSON.stringify(displayObj, null, 2);
  } catch {
    return "Invalid Address Data";
  }
});
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>