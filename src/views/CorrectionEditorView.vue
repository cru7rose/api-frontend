<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// *** FIX: Changed import from .ts to .js ***
import { useToast } from '@/composables/useToast.js';
// *** END FIX ***
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
const showNotification = inject("showNotification"); // Use global notification
const toast = useToast(); // Use composable toast for more flexibility

// === Route & Store ===
const route = useRoute();
const router = useRouter();
const worklistStore = useWorklistStore(); // Used for the "next item" queue
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
const routeInfo = ref(null); // To store distance/duration
const mapContainer = ref(null); // DOM ref for map

// === Controller Setup ===
// We create controllers here, in setup(), so they are reactive to this component's instance
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

  // 1. Initialize Map Controller
  try {
    const mapAdapter = geoRuntime.mapAdapter();
    mapController = new MapController(mapAdapter);
    await nextTick(); // Wait for DOM
    if (mapContainer.value) {
      await mapController.init(mapContainer.value, { lat: 52.23, lon: 21.01, zoom: 6 });
    } else {
      throw new Error("Map container DOM element not found.");
    }
  } catch (err) {
    log.error("Failed to initialize MapController:", err);
    toast.error("Failed to load map: " + err.message, 10000);
    // Continue without map if it fails
  }

  // 2. Initialize Editor Facade (passing the map)
  editorFacade = orchestrator.getEditor(mapController);

  // 3. Initialize Save Controllers
  // Note: IdempotentSaveController is deprecated, but SaveFlowController uses it
  const saveController = new IdempotentSaveController();
  saveFlow = new SaveFlowController(editorFacade, worklistStore, saveController);
  commandBus = new EditorCommandBus(editorFacade, saveFlow);

  // 4. Load Order Data
  await loadOrderData();
});

onUnmounted(() => {
  // Clean up map
  if (mapController) {
    mapController.destroy();
  }
});

// === Methods ===
async function loadOrderData() {
  state.loading = true;
  state.error = null;

  const result = await editorFacade.load(orderId.value);

  if (result.ok) {
    const snap = editorFacade.snapshot().editor;
    state.detail = snap.detail;
    state.editedPickup = snap.editedPickup;
    state.editedDelivery = snap.editedDelivery;

    // After load, facade's 'load' method already drew the route.
    // We just need to fetch the stats (dist/duration) for display.
    await refreshRouteInfo();

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