<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  address: Object, // This should be an Address object
  suggestions: {
    type: Array,
    default: () => []
  },
  loadingSuggestions: Boolean
});

const emit = defineEmits(['update:address', 'street-input', 'select-suggestion']);

// Create computed properties for v-model
const internalAddress = computed({
  get: () => props.address,
  set: (value) => {
    emit('update:address', value);
  }
});

// Emit an update for a single field
const onFieldChange = (field, value) => {
  emit('update:address', { ...internalAddress.value, [field]: value });
};

const onStreetKeydown = (event) => {
  if (event.key === 'ArrowDown' && props.suggestions.length > 0) {
    event.preventDefault();
    // TODO: Focus list
  }
}
</script>

<template>
  <div class="address-editor card">
    <h4>{{ title }}</h4>
    <div class="form-grid">

      <div class="form-group street-group">
        <label for="street">Street</label>
        <input
            type="text"
            id="street"
            :value="internalAddress.street"
            @input="onFieldChange('street', $event.target.value); $emit('street-input', $event)"
            @keydown="onStreetKeydown"
            autocomplete="off"
        />
        <div v-if="loadingSuggestions" class="suggestions-loading">Loading...</div>
        <ul v-if="suggestions.length > 0" class="suggestions-list">
          <li
              v-for="s in suggestions"
              :key="s.value"
              @mousedown.prevent="$emit('select-suggestion', s)"
          >
            {{ s.value }}
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label for="houseNo">House No.</label>
        <input type="text" id="houseNo" :value="internalAddress.houseNumber" @input="onFieldChange('houseNumber', $event.target.value)" />
      </div>

      <div class="form-group">
        <label for="postalCode">Postal Code</label>
        <input type="text" id="postalCode" :value="internalAddress.postalCode" @input="onFieldChange('postalCode', $event.target.value)" />
      </div>

      <div class="form-group">
        <label for="city">City</label>
        <input type="text" id="city" :value="internalAddress.city" @input="onFieldChange('city', $event.target.value)" />
      </div>

      <div class="form-group">
        <label for="country">Country</label>
        <input type="text" id="country" :value="internalAddress.country" @input="onFieldChange('country', $event.target.value)" />
      </div>

      <div class="form-group">
        <label for="lat">Latitude</label>
        <input type="text" id="lat" :value="internalAddress.latitude" @input="onFieldChange('latitude', $event.target.value)" />
      </div>

      <div class="form-group">
        <label for="lon">Longitude</label>
        <input type="text" id="lon" :value="internalAddress.longitude" @input="onFieldChange('longitude', $event.target.value)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.address-editor {
  padding: calc(var(--spacing-unit) * 1.5);
  border: 1px solid var(--color-border);
  box-shadow: none;
}
.address-editor h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-unit);
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-unit);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.street-group {
  grid-column: 1 / span 2;
  position: relative;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: calc(var(--spacing-unit) * 0.5);
}

.form-group input {
  width: 100%;
  padding: var(--spacing-unit);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-sizing: border-box; /* Important for grid layout */
}

.form-group input:disabled {
  background-color: #f0f0f0;
  color: var(--color-text-light);
}

.suggestions-loading {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid var(--color-border);
  padding: var(--spacing-unit);
  color: var(--color-text-light);
  z-index: 10;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid var(--color-border);
  border-top: none;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}
.suggestions-list li {
  padding: var(--spacing-unit);
  cursor: pointer;
}
.suggestions-list li:hover {
  background-color: #f0f0f0;
}
</style>