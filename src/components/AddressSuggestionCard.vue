<script setup>
import { AddressFormatterService } from "@/services/AddressFormatterService.js";
import { computed } from 'vue';

const props = defineProps({
  title: String,
  suggestions: Array
});

const emit = defineEmits(['accept']);

const formatter = new AddressFormatterService();

const formattedSuggestions = computed(() => {
  return (props.suggestions || []).map(s => ({
    ...s,
    display: s.fullAddressLabel || formatter.oneLine(s)
  }));
});
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
    <h3 class="text-lg font-semibold text-gray-800">{{ title }} ({{ (suggestions || []).length }})</h3>

    <div v-if="(suggestions || []).length === 0" class="text-sm text-gray-500 italic">
      No suggestions available.
    </div>

    <div v-else class="space-y-2">
      <div v-for="(suggestion, index) in formattedSuggestions" :key="index"
           class="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition flex justify-between items-center"
           @click="emit('accept', index)">
        <div class="text-sm">
          {{ suggestion.display }}
          <div class="text-xs text-gray-500 mt-1">
            Score: {{ (suggestion.matchScore * 100).toFixed(0) }}%, Source: {{ suggestion.providerSource }}
          </div>
        </div>
        <button class="text-blue-600 font-medium text-xs flex-shrink-0">
          Accept
        </button>
      </div>
    </div>
  </div>
</template>
