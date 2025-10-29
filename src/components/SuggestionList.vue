<template>
  <div class="suggestion-list">
    <h3 v-if="title">{{ title }}</h3>
    <ul v-if="suggestions && suggestions.length > 0">
      <li v-for="(suggestion, index) in suggestions" :key="index">
        <p><strong>{{ suggestion.fullAddressLabel || formatSuggestion(suggestion) }}</strong></p>
        <p>Score: {{ suggestion.matchScore?.toFixed(2) || 'N/A' }}, Level: {{ suggestion.matchLevel || 'N/A' }}, Source: {{ suggestion.providerSource || 'N/A' }}</p>
        <button @click="emitAccept(index)">Accept</button>
      </li>
    </ul>
    <p v-else>No suggestions available.</p>
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
.suggestion-list {
  margin-top: 15px;
}
h3 {
  margin-bottom: 10px;
  font-size: 1em;
  font-weight: bold;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px; /* Limit height */
  overflow-y: auto; /* Add scroll */
  border: 1px solid #eee;
  border-radius: 4px;
}
li {
  padding: 10px;
  border-bottom: 1px solid #eee;
}
li:last-child {
  border-bottom: none;
}
li p {
  margin: 0 0 5px 0;
  font-size: 0.9em;
}
li button {
  padding: 3px 8px;
  font-size: 0.8em;
  cursor: pointer;
  margin-top: 5px;
}
p {
  font-style: italic;
  color: #888;
}
</style>