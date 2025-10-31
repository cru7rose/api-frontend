<template>
  <div class="correction-editor-view p-4 md:p-6 bg-gray-100 min-h-full">
    <div v-if="state.loading" class="loading-indicator text-center py-20">
      <p class="text-lg font-medium text-gray-600">Loading order details...</p>
    </div>
    <div v-else-if="state.error" class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Failed to load order details:</strong>
      <span class="block sm:inline">{{ state.error }}</span>
      <span v-if="orderId"> (ID: {{ orderId }})</span>
    </div>

    <div
        v-else-if="state.detail" class="editor-layout space-y-6">
      <header class="editor-header bg-white shadow-md rounded-lg p-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-gray-800">
            Correction Editor (Barcode: <span class="text-blue-600 font-mono">{{ state.detail.barcode }}</span>)
          </h2>
          <p class="text-sm text-gray-500">
            Source: <span class="font-medium text-gray-700">{{ state.detail.sourceSystem }}</span> |
            Status: <StatusBadge :status="state.detail.processingStatus" />
          </p>
        </div>
      </header>

      <div class="editor-map bg-white shadow-md rounded-lg p-4">
        <div ref="mapContainer" class="map-container-element h-64 md:h-80 w-full rounded-md border border-gray-200"></div>
        <div v-if="routeInfo" class="route-info text-center text-sm text-gray-600 mt-2">
          <strong>Distance:</strong> {{ (routeInfo.distance / 1000).toFixed(2) }} km |
          <strong>Duration:</strong> {{ (routeInfo.duration / 60).toFixed(0) }} minutes
        </div>
      </div>

      <div class="editor-columns grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div class="address-column bg-white shadow-md rounded-lg space-y-4">
          <AddressDisplay
              title="Original Pickup"
              :address="state.detail.originalPickup"
              :alias="state.detail.originalPickup.alias"

          />
          <SuggestionList
              title="Pickup Suggestions"
              :suggestions="state.detail.suggestedPickup"
              @accept="handleAcceptSuggestion('pickup', $event)"
          />
          <AddressForm
              side="pickup"

              :initialAddress="state.editedPickup"
              :placesAdapter="placesAdapter"
              @update="handleFormUpdate"
          />
          <div class="column-actions flex justify-between items-center p-4 border-t border-gray-100">
            <button @click="handleUseOriginal('pickup')" class="button-secondary">Use Original</button>
            <div class="flex gap-2">
              <button @click="handleGeocode('pickup')" :disabled="state.geocodeLoading" class="button-secondary">
                {{ state.geocodeLoading ?
                  'Geocoding...' : 'Geocode Edited' }}
              </button>
              <button @click="handleSave('pickup')" :disabled="state.saveLoading || !isPending" class="button-primary" :title="!isPending ? 'Order is not pending verification' : 'Save and load next'">
                {{ state.saveLoading ?
                  'Saving...' : 'Save & Next (Pickup)' }}
              </button>
            </div>
          </div>
        </div>

        <div class="address-column bg-white shadow-md rounded-lg space-y-4">
          <AddressDisplay
              title="Original Delivery"
              :address="state.detail.originalDelivery"
              :alias="state.detail.originalDelivery.alias"

          />
          <SuggestionList
              title="Delivery Suggestions"
              :suggestions="state.detail.suggestedDelivery"
              @accept="handleAcceptSuggestion('delivery', $event)"
          />
          <AddressForm
              side="delivery"

              :initialAddress="state.editedDelivery"
              :placesAdapter="placesAdapter"
              @update="handleFormUpdate"
          />
          <div class="column-actions flex justify-between items-center p-4 border-t border-gray-100">
            <button @click="handleUseOriginal('delivery')" class="button-secondary">Use Original</button>
            <div class="flex gap-2">
              <button @click="handleGeocode('delivery')" :disabled="state.geocodeLoading" class="button-secondary">

                {{ state.geocodeLoading ? 'Geocoding...' : 'Geocode Edited' }}
              </button>
              <button @click="handleSave('delivery')" :disabled="state.saveLoading || !isPending" class="button-primary" :title="!isPending ? 'Order is not pending verification' : 'Save and load next'">
                {{ state.saveLoading ?
                  'Saving...' : 'Save & Next (Delivery)' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer class="editor-footer bg-white shadow-md rounded-lg p-4 flex justify-between items-center" v-if="isPending">
        <div class="bulk-toggle">
          <label for="applyToSimilar" class="flex items-center cursor-pointer">
            <input
                id="applyToSimilar"
                type="checkbox"

                v-model="applyToSimilar"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="ml-2 text-sm font-medium text-gray-700">Apply this correction to all similar pending errors</span>
          </label>
        </div>
        <button @click="handleSave('both')" :disabled="state.saveLoading" class="button-primary button-lg">
          {{ state.saveLoading ?
            'Saving...' : 'Save Both & Go to Next' }}
        </button>
      </footer>
      <footer v-else class="editor-footer bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
        <p class="font-medium text-yellow-800">
          This order is not in a 'PENDING_VERIFICATION' state and cannot be corrected.
          (Current Status:
          <StatusBadge :status="state.detail.processingStatus" />)
        </p>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast.js';

// Import classic components
import AddressDisplay from '@/components/AddressDisplay.vue';
import AddressForm from '@/components/AddressForm.vue';
import SuggestionList from '@/components/SuggestionList.vue';
import StatusBadge from '@/components/common/StatusBadge.vue'; // Import StatusBadge

// Import Manifesto architecture controllers
import { MapController } from "@/controllers/MapController.js";
import { EditorFacade } from "@/controllers/EditorFacade.js";
import { SaveFlowController } from "@/controllers/SaveFlowController.js";
// import { IdempotentSaveController } from "@/controllers/IdempotentSaveController.js";
// DEPRECATED
import { EditorCommandBus } from "@/controllers/EditorCommandBus.js";
import { useWorklistStore } from '@/stores/WorklistStore.js';
// To get the queue
import { Address } from '@/domain/WorkbenchModels.js';

// === Injections ===
const orchestrator = inject("orchestrator");
const geoRuntime = inject("geoRuntime");
const toast = useToast();

// === Route & Store ===
const route = useRoute();
const router = useRouter();
const worklistStore = useWorklistStore();
const orderId = ref(route.params.id);

// === Local State ===
const state = reactive({
  loading: true,
  error: null,
  detail: null,
  editedPickup: new Address(),
  editedDelivery: new Address(),
  geocodeLoading: false,
  saveLoading: false,
});
const applyToSimilar = ref(false);
const routeInfo = ref(null);
const mapContainer = ref(null); // DOM ref for map
const placesAdapter = ref(null);
// To pass to AddressForm

// === Controller Setup ===
let mapController = null;
let editorFacade = null;
let saveFlow = null;
let commandBus = null;

const isPending = computed(
    () => state.detail?.processingStatus === 'PENDING_VERIFICATION'
);
// === Lifecycle Hooks ===
onMounted(async () => {
  if (!orchestrator || !geoRuntime) {
    state.error = "Critical error: Orchestrator or GeoRuntime not injected.";
    state.loading = false;
    return;
  }

  // 1. Initialize Editor Facade (mapController is null for now)
  editorFacade = orchestrator.getEditor(null);

  // 1b. Get the places adapter (if it exists) for AddressForm
  try {
    placesAdapter.value = geoRuntime.placesAdapter();
  } catch(e) {
    log.error("Could not get places adapter for AddressForm", e);
    placesAdapter.value = null;
  }

  // *** BUILD FIX: Merged broken comment ***
// 2. Initialize Save Controllers
  // *** FIX: Instantiate SaveFlowController correctly ***
  // It now uses the corrected AddressExceptionApi logic internally
  saveFlow = new SaveFlowController(editorFacade, worklistStore);
  commandBus = new EditorCommandBus(editorFacade, saveFlow);
  // *** END FIX ***

  // 3. Load Order Data (this will trigger the 'watch' block to init the map)
  await loadOrderData();
});

onUnmounted(() => {
  // Clean up map
  if (mapController) {
    mapController.destroy();
    mapController = null;
  }
});
watch(mapContainer, async (newMapEl) => {
  if (newMapEl && !mapController) {
    log.info("Map container is now in DOM. Initializing MapController...");
    try {
      const mapAdapter = geoRuntime.mapAdapter();
      mapController = new MapController(mapAdapter);
      await mapController.init(newMapEl, {lat: 52.23, lon: 21.01, zoom: 6});

      // Inject the new mapController into the existing facade
      editorFacade = orchestrator.getEditor(mapController);

      log.info("MapController initialized and injected into facade.");

      // *** BUILD FIX: Merged broken comment into one line ***
// Now draw the initial route (data is already loaded and geocoded)
      if (state.editedPickup && state.editedDelivery) {
        await editorFacade.preview.policy.showAndFitRoute(
            state.editedPickup,
            state.editedDelivery
        );
        log.info("Initial route and markers drawn.");
      }

      await refreshRouteInfo();

    } catch (err) {
      // *** BUILD FIX: Corrected unterminated string literal ***
      log.error("Failed to initialize MapController in watch block:", err);
      toast.error("Failed to load map: " + err.message, 10000);
    }
  } else if (!newMapEl && mapController) {
    log.info("Map container removed. Destroying map controller.");
    await mapController.destroy();
    mapController = null;
    if (editorFacade) editorFacade.preview = null;
  }
});

// === Methods ===
async function loadOrderData() {
  state.loading = true;
  state.error = null;

  if (mapController) {
    await mapController.destroy();
    mapController = null;
    if (editorFacade) editorFacade.preview = null;
  }

  state.detail = null;

  // This load method now auto-geocodes if coords are missing
  const result = await editorFacade.load(orderId.value);
  if (result.ok) {
    const snap = editorFacade.snapshot().editor;
    state.detail = snap.detail;
    state.editedPickup = snap.editedPickup;
    state.editedDelivery = snap.editedDelivery;
  } else {
    state.error = result.error.message;
    toast.error(`Failed to load order: ${state.error}`, 10000);
  }
  state.loading = false;
}

async function refreshRouteInfo() {
  if (!geoRuntime || !geoRuntime._config.routingUrl) {
    log.warn("Cannot refresh route info: No routingUrl in geoRuntime.");
    return;
  }

  const p = state.editedPickup;
  const d = state.editedDelivery;
  if (!p?.longitude || !p?.latitude || !d?.longitude || !d?.latitude) {
    routeInfo.value = null;
    return;
  }

  const coords = `${p.longitude},${p.latitude};${d.longitude},${d.latitude}`;
  const url = `${geoRuntime._config.routingUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM responded with ${response.status}`);
    const data = await response.json();
    if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
      routeInfo.value = {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
      };
    } else {
      routeInfo.value = null;
    }
  } catch (error) {
    log.error('Error fetching OSRM route info:', error);
    routeInfo.value = null;
    toast.error(`Could not calculate route: ${error.message}`, 4000);
  }
}

// Handle updates from AddressForm.vue
function handleFormUpdate(side, field, value) {
  const target = side === 'pickup' ?
      state.editedPickup : state.editedDelivery;
  const newAddress = new Address({...target, [field]: value});
  if (side === 'pickup') {
    state.editedPickup = newAddress;
    editorFacade.setManualPickup(newAddress);
  } else {
    state.editedDelivery = newAddress;
    editorFacade.setManualDelivery(newAddress);
  }

  // After manual edit, refresh route
  refreshRouteInfo();
  if (mapController) {
    editorFacade.refreshRoute(); // Redraw map line
  }
}

// Handle accepting from SuggestionList.vue
function handleAcceptSuggestion(side, suggestionIndex) {
  if (side === 'pickup') {
    commandBus.acceptPickup(suggestionIndex);
  } else {
    commandBus.acceptDelivery(suggestionIndex);
  }
  // Update local state from facade
  const snap = editorFacade.snapshot().editor;
  state.editedPickup = snap.editedPickup;
  state.editedDelivery = snap.editedDelivery;

  editorFacade.refreshRoute();
  refreshRouteInfo();
  toast.info(`Suggestion applied to ${side} address.`, 2000);
}


async function handleGeocode(side) {
  state.geocodeLoading = true;
  toast.info(`Geocoding ${side} address...`, 2000);

  const result = await editorFacade.geocodeAndFocus(side);
  if (result.ok) {
    const snap = editorFacade.snapshot().editor;
    if (side === 'pickup') {
      state.editedPickup = snap.editedPickup;
    } else {
      state.editedDelivery = snap.editedDelivery;
    }
    await editorFacade.refreshRoute();
// Redraw route
    await refreshRouteInfo(); // Get new stats
    toast.success('Geocoding successful. Address updated.', 3000);
  } else {
    log.error(`Geocode failed for ${side}:`, result.error);
    toast.error(`Geocoding failed: ${result.error.message}`, 5000);
  }
  state.geocodeLoading = false;
}

function handleUseOriginal(side) {
  if (side === 'pickup') {
    commandBus.useOriginalPickup();
  } else {
    commandBus.useOriginalDelivery();
  }
  // Update local state from facade
  const snap = editorFacade.snapshot().editor;
  state.editedPickup = snap.editedPickup;
  state.editedDelivery = snap.editedDelivery;

  editorFacade.refreshRoute();
  refreshRouteInfo();
  toast.info(`Original ${side} address restored.`, 2000);
}

async function handleSave(side) {
  state.saveLoading = true;
  let result;
  try {
    if (side === 'pickup') {
      toast.info("Saving pickup and fetching next order...", 3000);
      result = await saveFlow.saveThenAwait('pickup', applyToSimilar.value);
    } else if (side === 'delivery') {
      toast.info("Saving delivery and fetching next order...", 3000);
      result = await saveFlow.saveThenAwait('delivery', applyToSimilar.value);
    } else {
      toast.info("Saving both and fetching next order...", 3000);
      result = await saveFlow.saveThenAwait('both', applyToSimilar.value);
    }

    if (result.ok) {
      if (result.value.nextOrderId) {
        toast.success("Save successful! Loading next order.", 3000);
        router.push({name: 'editor', params: {id: result.value.nextOrderId}});
        // Reload data for the new ID
        orderId.value = result.value.nextOrderId;
        await loadOrderData();
      } else {
        toast.success("Save successful! No more orders in queue.", 4000);
        router.push({name: 'worklist'});
      }
    } else {
      throw result.error;
    }
  } catch (e) {
    log.error(`Save flow failed for side '${side}':`, e);
    toast.error(`Save failed: ${e.message}`, 10000);
  } finally {
    state.saveLoading = false;
  }
}

// Basic logger shim
const log = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
</script>

<style scoped>
/* Modern styling for the editor view */
.correction-editor-view {
  max-width: 1600px;
  margin: 0 auto;
}

.editor-layout {
  display: grid;
  gap: 1.5rem; /* 24px */
}

/* Base styles for buttons */
.button-primary, .button-secondary {
  padding: 0.5rem 1rem;
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  border-radius: 0.375rem; /* 6px */
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.button-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.button-primary:hover:not(:disabled) {
  background-color: #004a9c; /* Darker blue */
}

.button-secondary {
  background-color: #f3f4f6; /* gray-100 */
  color: #374151; /* gray-700 */
  border-color: #d1d5db; /* gray-300 */
}

.button-secondary:hover:not(:disabled) {
  background-color: #e5e7eb; /* gray-200 */
}

.button-primary:disabled, .button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-lg {
  padding: 0.625rem 1.25rem;
  font-size: 1rem; /* 16px */
}

.address-column {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px */
}

.column-actions {
  /* Styles are applied via flex utility classes */
}

.editor-footer .bulk-toggle {
  /* Styles are applied via flex utility classes */
}
</style>