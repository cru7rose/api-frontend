<script setup>
// *** Import 'watch' ***
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
  }
});

// *** FIX: Use a watch to initialize the map ***
watch(() => state.detail, async (newValue, oldValue) => {
  // Only run this when the detail goes from null to populated
  if (newValue && !oldValue) {
    log.info("State detail populated, initializing map...");
    try {
      const mapAdapter = geoRuntime.mapAdapter();
      mapController = new MapController(mapAdapter);

      // Wait for Vue to render the v-if="state.detail" block
      await nextTick();

      if (mapContainer.value) {
        // Init the map
        await mapController.init(mapContainer.value, { lat: 52.23, lon: 21.01, zoom: 6 });

        // Inject the map into the facade
        editorFacade.preview = orchestrator.createPreviewController(mapController);
        log.info("MapController initialized and injected into facade.");

        // Now draw the initial route
        await editorFacade.preview.policy.showAndFitRoute(
            state.editedPickup,
            state.editedDelivery
        );
        log.info("Initial route and markers drawn.");

        // And fetch route stats
        await refreshRouteInfo();

      } else {
        throw new Error("Map container DOM element not found even after watch/nextTick.");
      }
    } catch (err) {
      log.error("Failed to initialize MapController:", err);
      toast.error("Failed to load map: " + err.message, 10000);
    }
  }
});

// === Methods ===
async function loadOrderData() {
  state.loading = true;
  state.error = null;

  // Destroy the old map if we are reloading (e.g., navigating from editor to editor)
  if (mapController) {
    await mapController.destroy();
    mapController = null;
    if (editorFacade) editorFacade.preview = null;
  }

  const result = await editorFacade.load(orderId.value);

  if (result.ok) {
    const snap = editorFacade.snapshot().editor;
    // Setting these will trigger the 'watch' block
    state.detail = snap.detail;
    state.editedPickup = snap.editedPickup;

    // *** THIS IS THE FIX ***
    // state.editedDelivery = snap.img.DbyHtKIl.js:30; // <-- BAD
    state.editedDelivery = snap.editedDelivery; // <-- GOOD
    // *** END FIX ***

  } else {
    state.error = result.error.message;
    toast.error(`Failed to load order: ${state.error}`, 10000);
    state.loading = false; // Stop loading on error
  }
  // state.loading = false is now set inside the watch block or here on error
  // We set it to false here, but the watch block will run async
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