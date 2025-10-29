<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  address: Object,
  storedAddress: Object,
  storedLabel: {
    type: String,
    default: 'Stored (TrackIT - if mismatched)'
  },
  diffSnapshot: Object
});
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
    <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>

    <!-- Current/Original Address -->
    <div class="border-b pb-2">
      <h4 class="text-sm font-medium text-gray-600">Original Address (Input)</h4>
      <pre class="bg-gray-50 p-2 text-xs rounded mt-1 overflow-x-auto">{{ JSON.stringify(address, null, 2) }}</pre>
    </div>

    <!-- Stored Address -->
    <div>
      <h4 class="text-sm font-medium text-gray-600">{{ storedLabel }}</h4>
      <pre class="bg-gray-50 p-2 text-xs rounded mt-1 overflow-x-auto">{{ storedAddress ? JSON.stringify(storedAddress, null, 2) : 'N/A' }}</pre>
    </div>

  </div>
</template>
