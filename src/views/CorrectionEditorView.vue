<template>
  <div class="correction-editor-view">
    <div v-if="state.loading" class="loading-indicator">
      <p>Loading order details...</p>
    </div>
    <div v-else-if="state.error" class="error-message">
      <p>
        Failed to load order details: {{ state.error }}
        <span v-if="orderId"> (ID: {{ orderId }})</span>
      </p>
    </div>

    <div v-else-if="state.detail" class="editor-layout">
      <header class="editor-header card">
        <h2>
          Correction Editor (Barcode: {{ state.detail.barcode }})
        </h2>
        <p>
          Source: {{ state.detail.sourceSystem }} | Status: {{ state.detail.processingStatus }}
        </p>
      </header>

      <div class="editor-map card">
        <div ref="mapContainer" class="map-container-element"></div>
        <div v-if="routeInfo" class="route-info">
          <strong>Distance:</strong> {{ (routeInfo.distance / 1000).toFixed(2) }} km |
          <strong>Duration:</strong> {{ (routeInfo.duration / 60).toFixed(0) }} minutes
        </div>
      </div>

      <div class="editor-columns">

        <div class="address-column card">
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
          <div class="column-actions">
            <button @click="handleUseOriginal('pickup')" class="button secondary">Use Original</button>
            <button @click="handleGeocode('pickup')" :disabled="state.geocodeLoading" class="button">
              {{ state.geocodeLoading ? 'Geocoding...' : 'Geocode Edited' }}
            </button>
            <button @click="handleSave('pickup')" :disabled="state.saveLoading" class="button">
              {{ state.saveLoading ? 'Saving...' : 'Save & Next (Pickup)' }}
            </button>
          </div>
        </div>

        <div class="address-column card">
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
          <div class="column-actions">
            <button @click="handleUseOriginal('delivery')" class="button secondary">Use Original</button>
            <button @click="handleGeocode('delivery')" :disabled="state.geocodeLoading" class="button">
              {{ state.geocodeLoading ? 'Geocoding...' : 'Geocode Edited' }}
            </button>
            <button @click="handleSave('delivery')" :disabled="state.saveLoading" class="button">
              {{ state.saveLoading ? 'Saving...' : 'Save & Next (Delivery)' }}
            </button>
          </div>
        </div>
      </div>

      <div class="editor-footer card" v-if="isPending">
        <div class="bulk-toggle">
          <input
              id="applyToSimilar"
              type="checkbox"
              v-model="applyToSimilar"
          />
          <label for="applyToSimilar">Apply this correction to all similar pending errors</label>
        </div>
        <button @click="handleSave('both')" :disabled="state.saveLoading" class="button">
          {{ state.saveLoading ? 'Saving...' : 'Save Both & Go to Next' }}
        </button>
      </div>
      <div v-else class="editor-footer card">
        <p>
          This order is not in a 'PENDING_VERIFICATION' state and cannot be corrected. (Status:
          {{ state.detail.processingStatus }})
        </p>
      </div>

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

// Import Manifesto architecture controllers
import { MapController } from "@/controllers/MapController.js";
import { EditorFacade } from "@/controllers/EditorFacade.js";
import { SaveFlowController } from "@/controllers/SaveFlowController.js";
// import { IdempotentSaveController } from "@/controllers/IdempotentSaveController.js"; // DEPRECATED
import { EditorCommandBus } from "@/controllers/EditorCommandBus.js";
import { useWorklistStore } from '@/stores/WorklistStore.js'; // To get the queue
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
const placesAdapter = ref(null); // To pass to AddressForm

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


  // 2. Initialize Save Controllers
  // *** FIX for DEPRECATED WARNING ***
  // The deprecated IdempotentSaveController is no longer instantiated.
  // SaveFlowController defaults to using AddressExceptionApi internally.
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
      await mapController.init(newMapEl, { lat: 52.23, lon: 21.01, zoom: 6 });

      // Inject the new mapController into the existing facade
      editorFacade = orchestrator.getEditor(mapController);

      log.info("MapController initialized and injected into facade.");

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
  const target = side === 'pickup' ? state.editedPickup : state.editedDelivery;
  const newAddress = new Address({ ...target, [field]: value });

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
    await editorFacade.refreshRoute(); // Redraw route
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
        router.push({ name: 'editor', params: { id: result.value.nextOrderId } });
        // Reload data for the new ID
        orderId.value = result.value.nextOrderId;
        await loadOrderData();
      } else {
        toast.success("Save successful! No more orders in queue.", 4000);
        router.push({ name: 'worklist' });
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
/* STYLING REST