<template>
  <div class="address-form p-4 border-t border-gray-100">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">{{ sideLabel }}</h3>
    <div class="form-group mb-3">

      <label :for="`${side}-alias`" class="block text-xs font-medium text-gray-600 mb-1">Alias</label>
      <input
          :id="`${side}-alias`"
          type="text"
          :value="addressModelValue?.alias"
          @input="emitUpdate('alias', $event.target.value)"
          class="form-input"
          readonly
          disabled
      />
    </div>

    <div class="form-grid grid grid-cols-2 gap-x-4 gap-y-3">
      <div class="form-group suggestion-group col-span-2">

        <label :for="`${side}-street`" class="block text-xs font-medium text-gray-600 mb-1">Street</label>
        <input
            :id="`${side}-street`"
            type="text"
            :value="addressModelValue?.street"
            @input="handleInput('street', $event.target.value)"
            @focus="handleFocus('street')"
            @blur="hideSuggestions"

            autocomplete="off"
            class="form-input"
        />
        <ul v-if="showSuggestions && activeField === 'street'" class="suggestions-dropdown" ref="streetSuggestionsRef">
          <li v-if="suggestionsLoading" class="suggestion-item-info">Loading...</li>
          <li v-else-if="suggestionsError" class="suggestion-item-error">{{ suggestionsError }}</li>
          <li v-else-if="suggestions.length === 0" class="suggestion-item-info">No suggestions found.</li>
          <li
              v-for="(suggestion, index) in
suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="activeSuggestionIndex = index"
              class="suggestion-item"
          >
            {{ formatSuggestion(suggestion) }}
          </li>

        </ul>
      </div>

      <div class="form-group col-span-1">
        <label :for="`${side}-houseNumber`" class="block text-xs font-medium text-gray-600 mb-1">House No.</label>
        <input
            :id="`${side}-houseNumber`"
            type="text"
            :value="addressModelValue?.houseNumber"
            @input="emitUpdate('houseNumber', $event.target.value)"
            class="form-input"
        />
      </div>


      <div class="form-group suggestion-group col-span-1">
        <label :for="`${side}-postalCode`" class="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
        <input
            :id="`${side}-postalCode`"
            type="text"
            :value="addressModelValue?.postalCode"
            @input="handleInput('postalCode', $event.target.value)"
            @focus="handleFocus('postalCode')"
            @blur="hideSuggestions"

            @keydown="handleKeydown"
            autocomplete="off"
            class="form-input"
        />
        <ul v-if="showSuggestions && activeField === 'postalCode'" class="suggestions-dropdown" ref="postalSuggestionsRef">
          <li v-if="suggestionsLoading" class="suggestion-item-info">Loading...</li>
          <li v-else-if="suggestionsError" class="suggestion-item-error">{{ suggestionsError }}</li>
          <li v-else-if="suggestions.length === 0" class="suggestion-item-info">No suggestions found.</li>
          <li

              v-for="(suggestion, index) in suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="activeSuggestionIndex = index"
              class="suggestion-item"
          >
            {{
              formatSuggestion(suggestion) }}
          </li>
        </ul>
      </div>

      <div class="form-group suggestion-group col-span-2">
        <label :for="`${side}-city`" class="block text-xs font-medium text-gray-600 mb-1">City</label>
        <input
            :id="`${side}-city`"
            type="text"
            :value="addressModelValue?.city"
            @input="handleInput('city', $event.target.value)"

            @focus="handleFocus('city')"
            @blur="hideSuggestions"
            @keydown="handleKeydown"
            autocomplete="off"
            class="form-input"
        />
        <ul v-if="showSuggestions && activeField === 'city'" class="suggestions-dropdown" ref="citySuggestionsRef">
          <li v-if="suggestionsLoading" class="suggestion-item-info">Loading...</li>
          <li v-else-if="suggestionsError" class="suggestion-item-error">{{ suggestionsError }}</li>

          <li v-else-if="suggestions.length === 0" class="suggestion-item-info">No suggestions found.</li>
          <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"

              @mouseenter="activeSuggestionIndex = index"
              class="suggestion-item"
          >
            {{ formatSuggestion(suggestion) }}
          </li>
        </ul>
      </div>

      <div class="form-group col-span-2">
        <label :for="`${side}-country`" class="block text-xs font-medium text-gray-600 mb-1">Country</label>
        <input
            :id="`${side}-country`"
            type="text"

            :value="addressModelValue?.country"
            @input="emitUpdate('country', $event.target.value)"
            maxlength="2"
            class="form-input"
        />
      </div>

      <div class="form-group coords col-span-1">
        <label :for="`${side}-latitude`" class="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
        <input
            :id="`${side}-latitude`"
            type="number"

            step="any"
            :value="addressModelValue?.latitude"
            @input="emitUpdate('latitude', $event.target.value ?
parseFloat($event.target.value) : null)"
            class="form-input"
        />
      </div>

      <div class="form-group coords col-span-1">
        <label :for="`${side}-longitude`" class="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
        <input
            :id="`${side}-longitude`"
            type="number"
            step="any"
            :value="addressModelValue?.longitude"

            @input="emitUpdate('longitude', $event.target.value ? parseFloat($event.target.value) : null)"
            class="form-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onUnmounted, nextTick } from 'vue';
// import { AddressExceptionApi } from '@/services/AddressExceptionApi'; // REMOVED
import { DebounceTimer } from '@/services/DebounceTimer';

const props = defineProps({
  side: {
    type: String,
    required: true,
  },
  initialAddress: {
    type: Object,
    default: () => ({ street: '', houseNumber: null, postalCode: '', city: '', country: 'PL', latitude: null, longitude: null, alias: '' }),
  },

  placesAdapter: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update']);
// --- State ---
const suggestions = ref([]);
const showSuggestions = ref(false);
const suggestionsLoading = ref(false);
const suggestionsError = ref(null);
const activeField = ref(null);
const activeSuggestionIndex = ref(-1);
const activeSuggestionSource = ref('none'); // 'google' or 'backend'

// *** BUGFIX: Remove broken API dependency ***
// const api = new AddressExceptionApi();
const placesDebouncer = new DebounceTimer(400); // Debounce for Google API calls
// const backendDebouncer = new DebounceTimer(300); // REMOVED

const addressModelValue = computed(() => props.initialAddress);
const sideLabel = computed(() => "Edit " + props.side.charAt(0).toUpperCase() + props.side.slice(1));
const localPlacesAdapter = ref(props.placesAdapter);

// --- Watch for adapter prop ---
watch(() => props.placesAdapter, (newAdapter) => {
  localPlacesAdapter.value = newAdapter;
  if(newAdapter) console.log(`Google Places Adapter received in AddressForm (${props.side}).`);
});
// --- Suggestion Fetching Logic ---

const fetchGoogleSuggestions = async (field, value) => {
  if (!localPlacesAdapter.value || !value || value.length < 3) {
    suggestions.value = [];
    showSuggestions.value = true;
    return;
  }

  activeSuggestionSource.value = 'google';
  activeField.value = field;
  activeSuggestionIndex.value = -1;
  suggestionsLoading.value = true;
  suggestionsError.value = null;
  showSuggestions.value = true;

  try {
    const query = value;
    const countryCode = addressModelValue.value?.country ||
        'PL';
    const results = await localPlacesAdapter.value.suggest(query, countryCode);
    suggestions.value = results || [];
  } catch (e) {
    suggestionsError.value = "Failed to fetch Google suggestions.";
    console.error(`fetchGoogleSuggestions error (${props.side}):`, e);
    suggestions.value = [];
  } finally {
    suggestionsLoading.value = false;
  }
};

// *** BUGFIX: Remove broken backend suggestion logic ***
// const fetchBackendSuggestions = ... (REMOVED)

// --- Event Handlers ---

const emitUpdate = (field, value) => {
  emit('update', props.side, field, value);
};
const handleInput = (field, value) => {
  emitUpdate(field, value);
  // Trigger Google Places (debounced) as primary suggestion source on type
  if (field === 'street' || field === 'city' || field === 'postalCode') {
    placesDebouncer.run(() => fetchGoogleSuggestions(field, value));
  } else {
    // Clear suggestions for other fields
    hideSuggestions();
    placesDebouncer.cancel();
    // backendDebouncer.cancel(); // REMOVED
  }
};
const handleFocus = (field) => {
  // Hide any other open dropdowns
  hideSuggestions();
  // Set active field for keyboard nav and context
  activeField.value = field;
  activeSuggestionIndex.value = -1;
  activeSuggestionSource.value = 'none';
  // Reset source

  // *** BUGFIX: Removed broken backend logic ***
  // if (field === 'street' || field === 'postalCode' || field === 'city') {
  //   if (suggestions.value.length === 0) {
  //     backendDebouncer.run(() => fetchBackendSuggestions(field));
  //   }
  // }
};

const selectSuggestion = (suggestion) => {
  if (!suggestion) return;

  const source = activeSuggestionSource.value;
  if (source === 'google') {
    // Google suggestion selected (full object)
    emitUpdate('street', suggestion.street || addressModelValue.value.street || '');
    emitUpdate('houseNumber', suggestion.houseNumber || addressModelValue.value.houseNumber || null);
    emitUpdate('postalCode', suggestion.postalCode || addressModelValue.value.postalCode || '');
    emitUpdate('city', suggestion.city || addressModelValue.value.city || '');
    emitUpdate('country', suggestion.countryCode || addressModelValue.value.country || 'PL');
    emitUpdate('latitude', suggestion.latitude);
    emitUpdate('longitude', suggestion.longitude);

    if (localPlacesAdapter.value) {
      localPlacesAdapter.value.session.renew();
    }
  }
  // *** BUGFIX: Removed broken 'backend' suggestion logic ***
  // else if (source === 'backend') { ... }

  hideSuggestions();
};

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
    activeField.value = null;
    activeSuggestionSource.value = 'none';
    activeSuggestionIndex.value = -1;
    suggestions.value = [];
    suggestionsError.value = null;
  }, 150);
};

const formatSuggestion = (s) => {
  // Google Places suggestion
  if (s.providerSource === 'GOOGLE_PLACES') {
    if (s.fullAddressLabel) return s.fullAddressLabel;
    const parts = [s.street, s.houseNumber, s.postalCode, s.city, s.countryCode].filter(Boolean);
    return parts.join(', ') || 'Suggestion';
  }
  // Backend suggestion (AddressLookupSuggestionDTO)
  return s.value;
};
// --- Keyboard Navigation ---
const handleKeydown = (event) => {
  if (!showSuggestions.value) return;

  const currentList = suggestions.value;
  if (currentList.length === 0 && !suggestionsLoading.value) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeSuggestionIndex.value = (activeSuggestionIndex.value + 1) % currentList.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeSuggestionIndex.value = (activeSuggestionIndex.value - 1 + currentList.length) % currentList.length;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (activeSuggestionIndex.value >= 0 && currentList[activeSuggestionIndex.value]) {
      selectSuggestion(currentList[activeSuggestionIndex.value]);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    hideSuggestions();
  }
};
onUnmounted(() => {
  placesDebouncer.cancel();
  // backendDebouncer.cancel(); // REMOVED
});
</script>

<style scoped>
/* Modern Form Input Styling */
.form-input {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem; /* 8px 12px */
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  color: #1f2937; /* gray-800 */
  background-color: #ffffff;
  border: 1px solid #d1d5db; /* gray-300 */
  border-radius: 0.375rem; /* 6px */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  z-index: 11;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 90, 156, 0.25);
  outline: none;
}

.form-input:disabled {
  background-color: #f3f4f6; /* gray-100 */
  color: #6b7280; /* gray-500 */
  cursor: not-allowed;
}

.form-group {
  position: relative;
}

/* Suggestions Dropdown Styling */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid var(--color-primary);
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem; /* 6px */
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0; /* 4px */
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin-top: -1px;
}

.suggestion-item {
  padding: 0.5rem 0.875rem; /* 8px 14px */
  cursor: pointer;
  font-size: 0.875rem; /* 14px */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggestion-item:hover,
.suggestion-item.active {
  background-color: var(--color-primary);
  color: white;
}

.suggestion-item-info,
.suggestion-item-error {
  font-style: italic;
  color: #6b7280; /* gray-500 */
  cursor: default;
  background-color: #f9fafb; /* gray-50 */
  padding: 0.5rem 0.875rem;
}
.suggestion-item-error {
  color: #dc3545; /* var(--color-danger) */
}
</style>