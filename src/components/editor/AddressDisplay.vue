<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  address: Object,
  formatter: Object,
  showCoords: {
    type: Boolean,
    default: false
  }
});

const formatted = computed(() => {
  if (!props.address) return null;
  return props.formatter?.twoLines(props.address);
});
</script>

<template>
  <div class="address-display card">
    <h4>{{ title }}</h4>
    <div v-if="!address" class="address-data empty-state">
      N/A
    </div>
    <div v-else class="address-data">
      <div class="address-line">{{ formatted.line1 }}</div>
      <div class="address-line">{{ formatted.line2 }}</div>
      <div v-if="showCoords" class="coords">
        Lat: {{ address.latitude || 'N/A' }}, Lon: {{ address.longitude || 'N/A' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.address-display {
  background-color: #f8f9fa; /* Lighter background for display */
  padding: calc(var(--spacing-unit) * 1.5);
  border-radius: 4px;
}
.address-display h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-unit);
  color: var(--color-text-light);
  font-size: 0.9rem;
}
.address-data {
  font-family: monospace;
  font-size: 0.9rem;
}
.address-line {
  min-height: 1.2em; /* Ensure line takes up space even if empty */
}
.empty-state {
  color: var(--color-text-light);
}
.coords {
  font-size: 0.8rem;
  color: var(--color-info);
  margin-top: var(--spacing-unit);
}
</style>