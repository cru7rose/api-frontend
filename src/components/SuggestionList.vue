<template>
  <div class="suggestion-list p-4">
    <h3 v-if="title" class="text-sm font-semibold text-gray-700 mb-2">{{ title }} ({{ (suggestions || []).length }})</h3>
    <ul v-if="suggestions && suggestions.length > 0" class="max-h-48 overflow-y-auto space-y-1 pr-2">
      <li v-for="(suggestion, index) in suggestions" :key="index"
          class="p-2 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition flex justify-between items-center group"
          @click="emitAccept(index)">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium
text-gray-800 truncate" :title="suggestion.fullAddressLabel || formatSuggestion(suggestion)">
            {{ suggestion.fullAddressLabel ||
          formatSuggestion(suggestion) }}
          </p>
          <p class="text-xs text-gray-500">
            Score: <span class="font-medium">{{ suggestion.matchScore?.toFixed(2) ||
          'N/A' }}</span>,
            Level: <span class="font-medium">{{ suggestion.matchLevel ||
          'N/A' }}</span>,
            Source: <span class="font-medium">{{ suggestion.providerSource ||
          'N/A' }}</span>
          </p>
        </div>
        <button class="ml-2 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Accept
        </button>
      </li>
    </ul>
    <p v-else class="text-sm text-gray-500 italic">No suggestions available.</p>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  suggestions: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['accept']);

const emitAccept = (index) => {
  emit('accept', index);
};
// Helper to format suggestion if full label is missing
const formatSuggestion = (s) => {
  const parts = [
    s.street, s.houseNumber, s.postalCode, s.city, s.countryCode
  ].filter(Boolean);
  return parts.join(', ') || 'Suggestion detail';
};
</script>

<style scoped>
/* Custom scrollbar for the list */
.max-h-48::-webkit-scrollbar {
  width: 6px;
}

.max-h-48::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.max-h-48::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.max-h-48::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>