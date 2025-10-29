<script setup>
import { ref, onMounted, onUnmounted, computed, watch, provide, nextTick } from 'vue'; // Import nextTick
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useWorklistStore } from '@/stores/worklistStore';
import { IntegrationOrchestrator } from '@/controllers/IntegrationOrchestrator';
import { EditorSessionStore } from '@/stores/EditorSessionStore';
import { Address } from '@/domain/WorkbenchModels';
import { AddressFormatterService } from '@/services/AddressFormatterService';
import { AddressExceptionApi } from '@/services/AddressExceptionApi';
import { GeocodeWithCacheController } from '@/controllers/GeocodeWithCacheController';
import { MapController } from '@/controllers/MapController';

// --- Page Components ---
import AddressDisplay from '@/components/editor/AddressDisplay.vue';
import AddressEditor from '@/components/editor/AddressEditor.vue';
// import AddressDiff from '@/components/editor/AddressDiff.vue'; // Optional
import StatusBadge from '@/components/common/StatusBadge.vue';
import ActionButton from '@/components/common/ActionButton.vue';

// --- Injected from main.js ---
import { inject } from 'vue';
const geoRuntime = inject('geoRuntime');
const showNotification = inject('showNotification');

// --- State ---
const route = useRoute();
const router = useRouter();
const worklistStore = useWorklistStore();
const api = new AddressExceptionApi(); // For autocomplete

const orderId = ref(route.params.id);
const isLoading = ref(true);
const error = ref(null);

// --- Local Controllers ---
const formatter = new AddressFormatterService();
const session = new EditorSessionStore(); // (Or inject if global)

// --- Core Editor Controllers (will be initialized in onMounted) ---
let orchestrator = null;
let mapController = null;
let geocodeController = null;
let editorFacade = null;

// --- Reactive Data Models ---
const orderDetail = ref(null); // The full order detail DTO
const editedPickup = ref(new Address());
const editedDelivery = ref(new Address());

// -- Computed Diff --
const hasPickupChanged = computed(() => {
  if (!orderDetail.value) return false;
  return JSON.stringify(orderDetail.value.originalPickup) !== JSON.stringify(editedPickup.value);
});
const hasDeliveryChanged = computed(() => {
  if (!orderDetail.value) return false;
  return JSON.stringify(orderDetail.value.originalDelivery) !== JSON.stringify(editedDelivery.value);
});
const hasAnyChanged = computed(() => hasPickupChanged.value || hasDeliveryChanged.value);


// --- Map Element Ref ---
const mapContainer = ref(null); // Ref for the map div

// --- Autocomplete State ---
const streetSuggestions = ref([]);
const streetLoading = ref(false);
let streetDebounceTimer = null;

// --- Methods ---

// *** BUILD FIX: Removed the underscore ***
const loadOrder = async (id) => {
  isLoading.value = true;
  error.value = null;
  try {
    const result = await editorFacade.load(id);
    if (!result.ok) throw result.error;

    const detail = result.value;
    orderDetail.value = detail;

    // Set initial state for editable forms
    editedPickup.value = new Address(detail.originalPickup);
    editedDelivery.value = new Address(detail.originalDelivery);

    // *** FIX: Initialize map AFTER data is loaded and v-if is true ***
    await nextTick(); // Wait for Vue to render the DOM

    if (mapContainer.value && !mapController._ready) { // Check if map is already init
      await mapController.init(mapContainer.value);
    }

    // Update map with initial markers
    await updateMapMarkers();

  } catch (err) {
    error.value = err.message || 'Failed to load order details.';
    console.error("Error loading order:", err);
  } finally {
    isLoading.value = false;
  }
};

const updateMapMarkers = async () => {
  if (!mapController || !mapController._ready) {
    console.warn("updateMapMarkers called but map is not ready.");
    return;
  }

  let pkPos = null, dlPos = null;

  // Prefer edited data
  const pickup = editedPickup.value;
  const delivery = editedDelivery.value;

  if (pickup?.latitude && pickup?.longitude) {
    pkPos = { lat: pickup.latitude, lon: pickup.longitude };
    await mapController.updatePickupMarker(pkPos.lat, pkPos.lon);
  }
  if (delivery?.latitude && delivery?.longitude) {
    dlPos = { lat: delivery.latitude, lon: delivery.longitude };
    await mapController.updateDeliveryMarker(dlPos.lat, dlPos.lon);
  }

  // If we have both, draw route and fit map
  if (pkPos && dlPos) {
    await mapController.drawRouteAndFit(pkPos, dlPos);
  } else if (pkPos) {
    // Only zoom if this is the *only* marker
    await mapController.setCenter(pkPos.lat, pkPos.lon, dlPos ? null : 15);
  } else if (dlPos) {
    // Only zoom if this is the *only* marker
    await mapController.setCenter(dlPos.lat, dlPos.lon, pkPos ? null : 15);
  }
};

// --- Geocoding Method (P2) ---
const handleGeocode = async (side) => {
  const addressToGeocode = (side === 'pickup') ? editedPickup.value : editedDelivery.value;

  // Use the GeocodeWithCacheController
  const result = await geocodeController.geocode(addressToGeocode);

  if (result && result.latitude && result.longitude) {
    if (side === 'pickup') {
      editedPickup.value.latitude = result.latitude;
      editedPickup.value.longitude = result.longitude;
    } else {
      editedDelivery.value.latitude = result.latitude;
      editedDelivery.value.longitude = result.longitude;
    }
    showNotification(`Geocode successful for ${side}`, 'success');
    await updateMapMarkers(); // Update map with new pin
  } else {
    showNotification(`Geocode failed for ${side}. Check address fields or Nominatim server.`, 'error');
  }
};

// --- Autocomplete Method (P5) ---
const onStreetInput = (event, side) => {
  const postal = (side === 'pickup') ? editedPickup.value.postalCode : editedDelivery.value.postalCode;
  const city = (side === 'pickup') ? editedPickup.value.city : editedDelivery.value.city;
  const query = event.target.value;

  if (query.length < 3 || !postal || !city) {
    streetSuggestions.value = [];
    return; // Only search if we have postal and city context
  }

  streetLoading.value = true;
  clearTimeout(streetDebounceTimer);
  streetDebounceTimer = setTimeout(async () => {
    try {
      // Use the API service directly for this simple lookup
      const result = await api.getStreetsForPostalCode(postal, city);
      if (result.ok) {
        // Filter results based on the query
        streetSuggestions.value = result.value
            .filter(s => s.value.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5); // Limit to 5
      } else {
        streetSuggestions.value = [];
      }
    } catch (e) {
      console.warn("Street suggestion query failed:", e);
      streetSuggestions.value = [];
    } finally {
      streetLoading.value = false;
    }
  }, 300);
};

const selectStreetSuggestion = (suggestion, side) => {
  if (side === 'pickup') {
    editedPickup.value.street = suggestion.value;
  } else {
    editedDelivery.value.street = suggestion.value;
  }
  streetSuggestions.value = []; // Hide suggestions
};


// --- Button Action Methods (P4) ---
const handleSave = async (side) => {
  isLoading.value = true; // Show global loader

  // 1. Determine which addresses to save
  const payload = {
    orderId: orderId.value,
    side: side, // 'pickup', 'delivery', or 'both'
    resolution: "MANUAL_EDIT",
    applyToSimilar: false, // You can add a checkbox to control this
    correctedPickup: (side === 'pickup' || side === 'both') ? editedPickup.value : null,
    correctedDelivery: (side === 'delivery' || side === 'both') ? editedDelivery.value : null,
  };

  // 2. Call the API
  const result = await api.saveCorrection(payload);

  if (result.ok) {
    showNotification('Save successful!', 'success');
    // 3. Reload the order to show the new "MANUALLY_CORRECTED" status
    await loadOrder(orderId.value);
  } else {
    showNotification(`Save failed: ${result.error.message}`, 'error');
    error.value = result.error.message;
  }
  isLoading.value = false;
};

const handleResubmit = async () => {
  isLoading.value = true;
  const result = await api.resubmitOrder(orderId.value);
  if (result.ok) {
    showNotification('Resubmit request sent. Order is queued for re-verification.', 'info');
    // Reload to show PENDING status
    await loadOrder(orderId.value);
  } else {
    showNotification(`Resubmit failed: ${result.error.message}`, 'error');
  }
  isLoading.value = false;
};


// --- Lifecycle ---
onMounted(async () => {
  // 1. Instantiate MapController
  mapController = new MapController(geoRuntime.mapAdapter());

  // 2. Instantiate GeocodeController
  geocodeController = new GeocodeWithCacheController(geoRuntime);

  // 3. Instantiate Orchestrator
  orchestrator = new IntegrationOrchestrator(geoRuntime, mapController);

  // 4. Get the facade
  editorFacade = orchestrator.getEditor();

  // 5. Load the order (this will now init the map *after* data is loaded)
  await loadOrder(orderId.value);
});

onUnmounted(() => {
  if (mapController) {
    mapController.destroy();
  }
  clearTimeout(streetDebounceTimer);
});

</script>

<template>
  <div class="correction-editor container">

    <div class="editor-header">
      <h1>Correction Editor</h1>
      <div class="header-details">
        <span>Order ID: {{ orderId }}</span>
        <span>Barcode: {{ orderDetail?.barcode }}</span>
      </div>
      <router-link to="/worklist" class="button secondary">Back to Worklist</router-link>
    </div>

    <div v-if="isLoading && !orderDetail" class="loading-full-page">Loading Order...</div>
    <div v-if="error" class="error-message card">{{ error }}</div>

    <div v-if="orderDetail" class="editor-grid">

      <section class="address-column">
        <h2>Pickup Address</h2>
        <StatusBadge :status="orderDetail.pickupReasonCode || 'N/A'" />

        <AddressDisplay
            title="Original Pickup"
            :address="orderDetail.originalPickup"
            :formatter="formatter"
            :show-coords="true"
        />

        <AddressDisplay
            :title="orderDetail.pickupStoredLabel || 'Stored (TrackIT)'"
            :address="orderDetail.pickupStoredAddress"
            :formatter="formatter"
            :show-coords="true"
        />

        <AddressEditor
            title="Edit Pickup"
            v-model:address="editedPickup"
            :suggestions="streetSuggestions"
            :loading-suggestions="streetLoading"
            @street-input="onStreetInput($event, 'pickup')"
            @select-suggestion="selectStreetSuggestion($event, 'pickup')"
        />
        <div class="button-bar">
          <ActionButton
              label="Geocode"
              @click="handleGeocode('pickup')"
              :disabled="isLoading"
              :secondary="true"
              title="Fetch Lat/Lon for the edited address"
          />
          <ActionButton
              label="Save Pickup"
              @click="handleSave('pickup')"
              :disabled="!hasPickupChanged || isLoading"
              class="button"
              title="Save changes to this pickup address"
          />
        </div>
      </section>

      <section class="address-column">
        <h2>Delivery Address</h2>
        <StatusBadge :status="orderDetail.deliveryReasonCode || 'N/A'" />

        <AddressDisplay
            title="Original Delivery"
            :address="orderDetail.originalDelivery"
            :formatter="formatter"
            :show-coords="true"
        />

        <AddressDisplay
            :title="orderDetail.deliveryStoredLabel || 'Stored (TrackIT)'"
            :address="orderDetail.deliveryStoredAddress"
            :formatter="formatter"
            :show-coords="true"
        />

        <AddressEditor
            title="Edit Delivery"
            v-model:address="editedDelivery"
            :suggestions="streetSuggestions"
            :loading-suggestions="streetLoading"
            @street-input="onStreetInput($event, 'delivery')"
            @select-suggestion="selectStreetSuggestion($event, 'delivery')"
        />
        <div class="button-bar">
          <ActionButton
              label="Geocode"
              @click="handleGeocode('delivery')"
              :disabled="isLoading"
              :secondary="true"
              title="Fetch Lat/Lon for the edited address"
          />
          <ActionButton
              label="Save Delivery"
              @click="handleSave('delivery')"
              :disabled="!hasDeliveryChanged || isLoading"
              class="button"
              title="Save changes to this delivery address"
          />
        </div>
      </section>

      <section class="bottom-section">

        <h3>Map Preview</h3>
        <div ref="mapContainer" class="map-container card">
          Map is initializing...
        </div>

        <div class="main-action-bar">
          <ActionButton
              label="Save Both"
              @click="handleSave('both')"
              :disabled="!hasAnyChanged || isLoading"
              class="button"
              title="Save changes to both addresses"
          />
          <ActionButton
              label="Resubmit Verification"
              @click="handleResubmit"
              :disabled="isLoading"
              class="button secondary"
              title="Use this if TrackIT aliases were fixed *after* this order was processed."
          />
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.correction-editor {
  /* Uses .container from theme */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(var(--spacing-unit) * 2);
  flex-wrap: wrap;
}
.editor-header h1 {
  margin: 0;
}
.header-details {
  display: flex;
  gap: var(--spacing-unit);
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--spacing-unit) * 3);
}

.address-column {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
}

.bottom-section {
  grid-column: 1 / -1; /* Span both columns */
  margin-top: calc(var(--spacing-unit) * 2);
}

.map-container {
  height: 400px;
  width: 100%;
  background-color: #f0f0f0;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.button-bar {
  display: flex;
  gap: var(--spacing-unit);
}

.main-action-bar {
  margin-top: calc(var(--spacing-unit) * 3);
  padding-top: calc(var(--spacing-unit) * 2);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-unit);
}

.loading-full-page {
  font-size: 1.5rem;
  color: var(--color-text-light);
  text-align: center;
  padding: calc(var(--spacing-unit) * 10) 0;
}
.error-message {
  background-color: var(--color-danger);
  color: white;
}
</style>