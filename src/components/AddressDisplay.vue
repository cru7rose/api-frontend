<template>
  <div class="address-display">
    <h3 v-if="title">{{ title }}</h3>
    <div v-if="alias" class="alias-display">
      <strong>Alias:</strong> {{ alias }}
    </div>
    <pre v-if="address">{{ formattedAddress }}</pre>
    <p v-else class="na-text">N/A</p>
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
    // Create a copy for display, remove alias if it exists
    const displayObj = { ...props.address };
    delete displayObj.alias;

    return JSON.stringify(displayObj, null, 2);
  } catch {
    return "Invalid Address Data";
  }
});
</script>

<style scoped>
.address-display {
  margin-bottom: 15px;
}
h3 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 1em;
  font-weight: bold;
  color: #444;
}
.alias-display {
  font-size: 0.9em;
  font-weight: 600;
  color: #0056b3; /* Dark blue for alias */
  margin-bottom: 5px;
  padding: 4px 0;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.85em;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #e0e0e0;
}
p.na-text {
  color: #888;
  font-style: italic;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 4px;
}
</style>