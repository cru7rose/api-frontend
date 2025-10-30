<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div v-if="state.loading" class="text-center">
      <p>Loading order details...</p>
    </div>
    <div v-else-if="state.error" class="text-red-500 text-center">
      <p>
        Failed to load order details: {{ state.error }}
        <span v-if="orderId"> (ID: {{ orderId }})</span>
      </p>
    </div>

    <div v-else-if="state.detail" class="space-y-8">
      <PageHeader
          :title="`Correction Editor (Barcode: ${state.detail.barcode})`"
          :subtitle="`Source: ${state.detail.sourceSystem} | Status: ${state.detail.processingStatus}`"
      />

      <div class="mt-8" style="min-height: 400px">
        <div ref="mapContainer" style="height: 400px; width: 100%; border-radius: 8px"></div>
        <div v-if="routeInfo" class="mt-4 text-center text-gray-700 dark:text-gray-200">
          <p>
            <strong>Distance:</strong> {{ (routeInfo.distance / 1000).toFixed(2) }} km |
            <strong>Duration:</strong> {{ (routeInfo.duration / 60).toFixed(0) }} minutes
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddressCorrectionCard
            title="Pickup Address"
            side="pickup"
            :original-address="state.detail.originalPickup"
            :stored-address="state.detail.pickupStoredAddress"
            :reason-code="state.detail.pickupReasonCode"
            :is-pending="isPending"
            :editable-address="state.editedPickup"
            :geocode-loading="state.geocodeLoading"
            @update:editableAddress="updateAddress('pickup', $event)"
            @geocode="handleGeocode('pickup')"
            @save="handleSave('pickup')"
            @use-original="handleUseOriginal('pickup')"
        />

        <AddressCorrectionCard
            title="Delivery Address"
            side="delivery"
            :original-address="state.detail.originalDelivery"
            :stored-address="state.detail.deliveryStoredAddress"
            :reason-code="state.detail.deliveryReasonCode"
            :is-pending="isPending"
            :editable-address="state.editedDelivery"
            :geocode-loading="state.geocodeLoading"
            @update:editableAddress="updateAddress('delivery', $event)"
            @geocode="handleGeocode('delivery')"
            @save="handleSave('delivery')"
            @use-original="handleUseOriginal('delivery')"
        />
      </div>

      <div
          v-if="isPending"
          class="mt-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="flex items-center">
          <input
              id="applyToSimilar"
              type="checkbox"
              v-model="applyToSimilar"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="applyToSimilar" class="ml-2 block text-sm text-gray-900 dark:text-gray-100"
          >Apply this correction to all similar pending errors</label
          >
        </div>

        <div class="flex items-center space-x-2">
          <button
              @click="handleSave('both')"
              :disabled="state.saveLoading"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {{ state.saveLoading ? 'Saving...' : 'Save Both & Go to Next' }}
          </button>
        </div>
      </div>
      <div v-else class="mt-8 p-4 bg-white dark:bg-gray-800 shadow rounded-lg text-center">
        <p class="font-semibold text-gray-700 dark:text-gray-200">
          This order is not in a 'PENDING_VERIFICATION' state and cannot be corrected. (Status:
          {{ state.detail.processingStatus }})
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast.js';
import PageHeader from '@/components/PageHeader.vue';
import AddressCorrectionCard from '@/components/AddressCorrectionCard.vue';

// Import Manifesto architecture controllers
import { MapController } from "@/controllers/MapController.js";
import { EditorFacade } from "@/controllers/EditorFacade.js";
import { SaveFlowController } from "@/controllers/SaveFlowController.js";
import { IdempotentSaveController } from "@/controllers/IdempotentSaveController.js";
import { EditorCommandBus } from "@/controllers/EditorCommandBus.js";
import { useWorklistStore } from '@/stores/WorklistStore.js'; // To get the queue
import { Address } from '@/domain/WorkbenchModels.js';

// === Injections ===
const orchestrator = inject("orchestrator");
const geoRuntime = inject("geoRuntime");
const showNotification = inject("showNotification");
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

  // 2. Initialize Save Controllers
  const saveController = new IdempotentSaveController();
  saveFlow = new SaveFlowController(editorFacade, worklistStore, saveController);
  commandBus = new EditorCommandBus(editorFacade, saveFlow);

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

// *** FIX: Use a watch to initialize the map ***
// This watch fires when the 'mapContainer' ref changes.
// 1. On load, it's null.
// 2. After loadOrderData() sets state.detail, Vue renders the <div>.
// 3. Vue attaches the <div> to the ref, so mapContainer.value becomes non-null.
// 4. This 'watch' block fires, and we can safely initialize the map.
watch(mapContainer, async (newMapEl) => {
  if (newMapEl && !mapController) { // Only init if we have the element AND map isn't already initted
    log.info("Map container is now in DOM. Initializing MapController...");
    try {
      const mapAdapter = geoRuntime.mapAdapter();
      mapController = new MapController(mapAdapter);
      await mapController.init(newMapEl, { lat: 52.23, lon: 21.01, zoom: 6 });

      // Inject the map into the facade
      editorFacade.preview = orchestrator.createPreviewController(mapController);
      log.info("MapController initialized and injected into facade.");

      // Now draw the initial route
      if (state.editedPickup && state.editedDelivery) {
        await editorFacade.preview.policy.showAndFitRoute(
            state.editedPickup,
            state.editedDelivery
        );
        log.info("Initial route and markers drawn.");
      }

      // And fetch route stats
      await refreshRouteInfo();

    } catch (err) {
      log.error("Failed to initialize MapController in watch block:", err);
      toast.error("Failed to load map: " + err.message, 10000);
    }
  } else if (!newMapEl && mapController) {
    // This happens on unmount/reload
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

  // Destroy the old map controller IF it exists
  // This sets mapContainer.value to null (when v-if hides it), triggering the watch's cleanup
  if (mapController) {
    await mapController.destroy();
    mapController = null;
    if (editorFacade) editorFacade.preview = null;
  }

  // Set detail to null to hide the old view and unmount the mapContainer ref
  state.detail = null;

  const result = await editorFacade.load(orderId.value);

  if (result.ok) {
    const snap = editorFacade.snapshot().editor;
    // Setting these will trigger the v-else-if and THEN the mapContainer watch
    state.detail = snap.detail;
    state.editedPickup = snap.editedPickup;
    state.editedDelivery = snap.editedDelivery;
  } else {
    state.error = result.error.message;
    toast.error(`Failed to load order: ${state.error}`, 10000);
  }
  state.loading = false;
}

// Fetches route stats from OSRM (via proxy)
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
    const response = await fetch(url); // Use fetch, as it's not an API call
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

// Update local state and facade state
function updateAddress(side, newAddressObject) {
  if (side === 'pickup') {
    state.editedPickup = newAddressObject;
    editorFacade.setManualPickup(newAddressObject);
  } else {
    state.editedDelivery = newAddressObject;
    editorFacade.setManualDelivery(newAddressObject);
  }
  // After manual edit, refresh route
  refreshRouteInfo();
  if (mapController) {
    editorFacade.refreshRoute(); // Redraw map line
  }
}

async function handleGeocode(side) {
  state.geocodeLoading = true;
  toast.info(`Geocoding ${side} address...`, 2000);

  // This uses the Manifesto stack (GeoRuntime -> NominatimAdapter)
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