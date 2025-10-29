<template>
  <div class="address-form">
    <h3>Edit {{ sideLabel }}</h3>
    <div class="form-group alias-group">
      <label :for="`${side}-alias`">Alias</label>
      <input
          :id="`${side}-alias`"
          type="text"
          :value="addressModelValue?.alias"
          @input="emitUpdate('alias', $event.target.value)"
          readonly
          disabled
      />
    </div>

    <div class="form-grid">
      <div class="form-group suggestion-group">
        <label :for="`${side}-street`">Street</label>
        <input
            :id="`${side}-street`"
            type="text"
            :value="addressModelValue?.street"
            @input="handleInput('street', $event.target.value)"
            @focus="handleFocus('street')"
            @blur="hideSuggestions"
            @keydown="handleKeydown"
            autocomplete="off"
        />
        <ul v-if="showSuggestions && activeField === 'street'" class="suggestions-dropdown" ref="streetSuggestionsRef">
          <li v-if="suggestionsLoading" class="loading-item">Loading...</li>
          <li v-else-if="suggestionsError" class="error-item">{{ suggestionsError }}</li>
          <li v-else-if="suggestions.length === 0" class="no-results-item">No suggestions found.</li>
          <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="activeSuggestionIndex = index"
          >
            {{ formatSuggestion(suggestion) }}
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label :for="`${side}-houseNumber`">House No.</label>
        <input
            :id="`${side}-houseNumber`"
            type="text"
            :value="addressModelValue?.houseNumber"
            @input="emitUpdate('houseNumber', $event.target.value)"
        />
      </div>

      <div class="form-group suggestion-group">
        <label :for="`${side}-postalCode`">Postal Code</label>
        <input
            :id="`${side}-postalCode`"
            type="text"
            :value="addressModelValue?.postalCode"
            @input="handleInput('postalCode', $event.target.value)"
            @focus="handleFocus('postalCode')"
            @blur="hideSuggestions"
            @keydown="handleKeydown"
            autocomplete="off"
        />
        <ul v-if="showSuggestions && activeField === 'postalCode'" class="suggestions-dropdown" ref="postalSuggestionsRef">
          <li v-if="suggestionsLoading" class="loading-item">Loading...</li>
          <li v-else-if="suggestionsError" class="error-item">{{ suggestionsError }}</li>
          <li v-else-if="suggestions.length === 0" class="no-results-item">No suggestions found.</li>
          <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="activeSuggestionIndex = index"
          >
            {{ formatSuggestion(suggestion) }}
          </li>
        </ul>
      </div>

      <div class="form-group suggestion-group">
        <label :for="`${side}-city`">City</label>
        <input
            :id="`${side}-city`"
            type="text"
            :value="addressModelValue?.city"
            @input="handleInput('city', $event.target.value)"
            @focus="handleFocus('city')"
            @blur="hideSuggestions"
            @keydown="handleKeydown"
            autocomplete="off"
        />
        <ul v-if="showSuggestions && activeField === 'city'" class="suggestions-dropdown" ref="citySuggestionsRef">
          <li v-if="suggestionsLoading" class="loading-item">Loading...</li>
          <li v-else-if="suggestionsError" class="error-item">{{ suggestionsError }}</li>
          <li v-else-if="suggestions.length === 0" class="no-results-item">No suggestions found.</li>
          <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :class="{ active: activeSuggestionIndex === index }"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="activeSuggestionIndex = index"
          >
            {{ formatSuggestion(suggestion) }}
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label :for="`${side}-country`">Country</label>
        <input
            :id="`${side}-country`"
            type="text"
            :value="addressModelValue?.country"
            @input="emitUpdate('country', $event.target.value)"
            maxlength="2"
        />
      </div>

      <div class="form-group coords">
        <label :for="`${side}-latitude`">Latitude</label>
        <input
            :id="`${side}-latitude`"
            type="number"
            step="any"
            :value="addressModelValue?.latitude"
            @input="emitUpdate('latitude', $event.target.value ? parseFloat($event.target.value) : null)"
        />
      </div>

      <div class="form-group coords">
        <label :for="`${side}-longitude`">Longitude</label>
        <input
            :id="`${side}-longitude`"
            type="number"
            step="any"
            :value="addressModelValue?.longitude"
            @input="emitUpdate('longitude', $event.target.value ? parseFloat($event.target.value) : null)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onUnmounted, nextTick } from 'vue';
import { AddressExceptionApi } from '@/services/AddressExceptionApi';
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

const api = new AddressExceptionApi();
const placesDebouncer = new DebounceTimer(400); // Debounce for Google API calls
const backendDebouncer = new DebounceTimer(300); // Debounce for backend API calls

const addressModelValue = computed(() => props.initialAddress);
const sideLabel = computed(() => props.side.charAt(0).toUpperCase() + props.side.slice(1));
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
    const countryCode = addressModelValue.value?.country || 'PL';
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

const fetchBackendSuggestions = async (field) => {
  // Only proceed if Google is not currently active
  if (activeSuggestionSource.value === 'google' && suggestions.value.length > 0) return;

  activeSuggestionSource.value = 'backend';
  activeField.value = field;
  activeSuggestionIndex.value = -1;
  suggestionsLoading.value = true;
  suggestionsError.value = null;
  showSuggestions.value = true; // Show dropdown
  suggestions.value = []; // Clear previous

  let result;
  let contextMissing = false;

  try {
    const addr = addressModelValue.value;
    if (field === 'street') {
      if (!addr?.postalCode) { suggestionsError.value = "Enter Postal Code first."; contextMissing = true; }
      else result = await api.getStreetsForPostalCode(addr.postalCode, addr.city);
    } else if (field === 'postalCode') {
      if (!addr?.street || !addr?.city) { suggestionsError.value = "Enter Street and City first."; contextMissing = true; }
      else result = await api.getPostalCodesForStreet(addr.street, addr.city);
    } else if (field === 'city') {
      if (!addr?.postalCode) { suggestionsError.value = "Enter Postal Code first."; contextMissing = true; }
      else result = await api.getCitiesForPostalCode(addr.postalCode);
    } else {
      contextMissing = true; // Not a field we fetch for
    }

    if (contextMissing) {
      suggestions.value = [];
      // Do not show "no results" if context was missing
      if (!suggestionsError.value) showSuggestions.value = false;
    } else if (result && result.ok) {
      suggestions.value = result.value; // Expecting AddressLookupSuggestionDTO[]
    } else if (result) {
      suggestionsError.value = result.error.message;
    }
  } catch (e) {
    suggestionsError.value = `Failed to fetch ${field} suggestions.`;
    console.error(`fetchBackendSuggestions (${field}) error:`, e);
  } finally {
    suggestionsLoading.value = false;
  }
};

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
    backendDebouncer.cancel();
  }
};

const handleFocus = (field) => {
  // Hide any other open dropdowns
  hideSuggestions();
  // Set active field for keyboard nav and context
  activeField.value = field;
  activeSuggestionIndex.value = -1;
  activeSuggestionSource.value = 'none'; // Reset source

  // Trigger backend suggestions (debounced) on focus
  if (field === 'street' || field === 'postalCode' || field === 'city') {
    // Only run if Google suggestions aren't already active from typing
    if (suggestions.value.length === 0) {
      backendDebouncer.run(() => fetchBackendSuggestions(field));
    }
  }
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
  } else if (source === 'backend') {
    // Backend suggestion selected (AddressLookupSuggestionDTO)
    const field = activeField.value; // Field that was focused
    emitUpdate(field, suggestion.value);
    if (suggestion.latitude != null) emitUpdate('latitude', suggestion.latitude);
    if (suggestion.longitude != null) emitUpdate('longitude', suggestion.longitude);

    // Auto-fetch related fields
    nextTick(() => {
      if (field === 'postalCode') {
        fetchCitySuggestions();
        fetchStreetSuggestions();
      } else if (field === 'city') {
        fetchPostalCodeSuggestions();
      } else if (field === 'street') {
        fetchPostalCodeSuggestions();
      }
    });
  }

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
  }, 150); // Delay closing dropdown
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
  backendDebouncer.cancel();
});
</script>

<style scoped>
.address-form {
  margin-top: 15px;
}
.form-grid {
  display: grid;
  /* Flexible columns, min 200px, max 1fr */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 18px; /* Increased gap */
}
/* Style the alias field separately */
.alias-group {
  /* Span full width */
  grid-column: 1 / -1;
}
.alias-group input {
  background-color: #f4f4f4; /* Disabled appearance */
  color: #333;
  font-weight: bold;
  cursor: not-allowed;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}
.form-group label {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #333;
  font-weight: 600;
}
.form-group input {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  position: relative;
  z-index: 2;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-group input:focus {
  z-index: 11;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,.25);
  outline: none;
}

.form-group.coords input {
  font-size: 0.9em;
  color: #495057;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%; /* Position below the input */
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #007bff; /* Match focus color */
  border-top: none;
  border-radius: 0 0 5px 5px;
  max-height: 180px; /* Taller list */
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px 0; /* Padding top/bottom */
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  /* Floating effect */
  margin-top: -1px; /* Overlap input border */
}
.suggestions-dropdown li {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.95em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggestions-dropdown li:hover,
.suggestions-dropdown li.active { /* Style for active item */
  background-color: #007bff;
  color: white;
}
.suggestions-dropdown li.loading-item,
.suggestions-dropdown li.error-item,
.suggestions-dropdown li.no-results-item {
  font-style: italic;
  color: #6c757d;
  cursor: default;
  background-color: #f8f9fa;
  padding: 10px 14px;
}
.suggestions-dropdown li.error-item {
  color: #dc3545;
}


.suggestion-error {
  font-size: 0.8em;
  color: #dc3545;
  margin-top: 4px;
  padding: 4px 6px;
  border-radius: 3px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 9;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: -1px;
}
.suggestion-error.context-error {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
}
</style>