<script setup>
/**
 * ARCHITECTURE: CorrectionEditorView provides the UI for side-by-side address comparison and editing.
 * It orchestrates loading, user input, map interaction, and saving via EditorFacade and related controllers.
 * Responsibilities:
 * - Load order details and suggestions based on route parameter (orderId).
 * - Display original, suggested, and editable address fields for pickup and delivery.
 * - Integrate the Google Map view via MapController.
 * - Handle user actions: Accept Suggestion, Use Original, Manual Edit, Save, Save & Next.
 * - Fetch suggestions/error details using the processingErrorsStore.
 */
import { ref, onMounted, onUnmounted, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProcessingErrorsStore } from '@/stores/processingErrorsStore'; // For suggestions
import { Address } from '@/domain/WorkbenchModels'; // Domain model

// --- Injected Controllers/Services ---
const orchestrator = inject('orchestrator');
const googleKey = inject('googleKey'); // Provided in main.js
const editorFacade = orchestrator.getEditor();
const mapController = orchestrator.mapController; // Assuming orchestrator provides this after init
const processingErrorsStore = useProcessingErrorsStore();

// --- Routing ---
const route = useRoute();
const router = useRouter();

// --- Component State ---
const orderId = ref(route.params.id);
const editorState = ref(editorFacade.snapshot()); // Reactive snapshot
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref(null);
const mapContainer = ref(null); // Template ref for map div

// Separate reactive models for editable fields to avoid direct mutation of facade state
const editablePickup = ref(new Address());
const editableDelivery = ref(new Address());

// --- Methods ---
async function loadOrderData(id) {
  isLoading.value = true;
  error.value = null;
  const loadResult = await editorFacade.load(id);

  if (loadResult.ok) {
    editorState.value = editorFacade.snapshot();
    // Initialize editable models from the loaded state
    editablePickup.value = Address.from(editorState.value.editor?.editedPickup || editorState.value.editor?.detail?.originalPickup);
    editableDelivery.value = Address.from(editorState.value.editor?.editedDelivery || editorState.value.editor?.detail?.originalDelivery);

    // Fetch suggestions/error details separately
    if (editorState.value.editor?.detail?.barcode) {
      await processingErrorsStore.fetchProcessingErrors({ barcode: editorState.value.editor.detail.barcode, size: 1 });
      // Assuming the store updates `currentErrorDetails` or provides a way to get suggestions by barcode/eventId
      // Update editorState.value.editor.detail.suggestedPickup/Delivery based on store result
      // This part needs refinement based on how suggestions are stored/retrieved
      const errorDetails = processingErrorsStore.errors.find(e => e.barcode === editorState.value.editor.detail.barcode); // Simplistic lookup
      if (errorDetails?.suggestedAddresses?.length > 0) {
        // Need logic to determine if suggestions are for pickup or delivery based on errorType maybe
        // For now, let's assume suggestions apply to delivery if present
        if (editorState.value.editor.detail) {
          editorState.value.editor.detail.suggestedDelivery = errorDetails.suggestedAddresses;
        }
      }
    }

    // Focus map on delivery address initially
    focusMap(editableDelivery.value);

  } else {
    error.value = loadResult.error?.message || 'Failed to load order details';
  }
  isLoading.value = false;
}

function handleAcceptSuggestion(side, index = 0) {
  const result = side === 'pickup'
      ? editorFacade.acceptPickupSuggestion(index)
      : editorFacade.acceptDeliverySuggestion(index);

  if (result.ok) {
    // Update local editable models after facade updates its internal state
    editorState.value = editorFacade.snapshot();
    editablePickup.value = Address.from(editorState.value.editor?.editedPickup);
    editableDelivery.value = Address.from(editorState.value.editor?.editedDelivery);
    focusMap(side === 'pickup' ? editablePickup.value : editableDelivery.value);
  } else {
    console.error(`Failed to accept ${side} suggestion:`, result.error);
    // Show user feedback?
  }
}

function handleUseOriginal(side) {
  const result = side === 'pickup'
      ? editorFacade.useOriginalPickup()
      : editorFacade.useOriginalDelivery();

  if (result.ok) {
    editorState.value = editorFacade.snapshot();
    editablePickup.value = Address.from(editorState.value.editor?.editedPickup);
    editableDelivery.value = Address.from(editorState.value.editor?.editedDelivery);
    focusMap(side === 'pickup' ? editablePickup.value : editableDelivery.value);
  } else {
    console.error(`Failed to use original ${side}:`, result.error);
  }
}

// Update facade when local editable models change
watch(editablePickup, (newVal) => {
  editorFacade.setManualPickup(Address.from(newVal)); // Use clone/from to avoid reactivity issues
  // Optionally trigger geocoding on change (debounced)
}, { deep: true });

watch(editableDelivery, (newVal) => {
  editorFacade.setManualDelivery(Address.from(newVal));
  // Optionally trigger geocoding on change (debounced)
  focusMap(newVal); // Focus map on delivery changes
}, { deep: true });


async function handleSave(side = 'both') {
  isSaving.value = true;
  error.value = null;
  // Use the new saveCorrection method directly
  const payload = {
    orderId: orderId.value,
    side: side,
    // Pass the *current* editable state directly
    correctedPickup: side === 'pickup' || side === 'both' ? editablePickup.value.toPlain() : null,
    correctedDelivery: side === 'delivery' || side === 'both' ? editableDelivery.value.toPlain() : null,
    resolution: editorState.value.editor?.detail?.processingStatus === 'ADDRESS_NEEDS_REVIEW' ? 'MANUAL_EDIT' : 'ACCEPT_SUGGESTION' // Example logic
  };

  try {
    const saveResult = await editorFacade.api.saveCorrection(payload); // Assuming api is accessible
    if (saveResult.ok) {
      console.log('Save successful:', saveResult.value);
      // Optionally navigate back or show success
      router.push('/worklist'); // Example: Navigate back after save
    } else {
      throw saveResult.error;
    }
  } catch (err) {
    error.value = err.message || 'Failed to save correction';
    console.error('Save failed:', err);
  } finally {
    isSaving.value = false;
  }
}

async function handleSaveAndNext() {
  // Implementation needs SaveAndNextController or similar logic
  console.warn('Save & Next not fully implemented yet');
  // 1. Call handleSave()
  // 2. If successful, use orchestrator.queue to get next ID
  // 3. Navigate router.push(`/editor/${nextId}`)
}

async function focusMap(address) {
  if (mapController && address?.latitude != null && address?.longitude != null) {
    try {
      await mapController.updateMarker(address.latitude, address.longitude, true);
    } catch (mapError) {
      console.warn("Map focus/update failed:", mapError);
    }
  } else if (mapController) {
    console.debug("Cannot focus map, address or coordinates missing:", address);
    // Maybe try geocoding the address here if coords are missing?
  }
}


// --- Lifecycle & Map Initialization ---
onMounted(async () => {
  if (!googleKey) {
    error.value = "Google Maps API Key is missing. Map functionality disabled.";
    console.error(error.value);
    await loadOrderData(orderId.value); // Load order even if map fails
    return;
  }
  try {
    // Ensure Google Runtime and MapController are initialized
    // This might happen in main.js or App.vue, ensure mapController is ready here
    if (!orchestrator.google) {
      await orchestrator.googleRuntime.init(googleKey); // Assuming googleRuntime exists
      orchestrator.google = orchestrator.googleRuntime._google; // Assign loaded object
    }
    if (!orchestrator.mapController && mapContainer.value) {
      const mapAdapter = orchestrator.googleRuntime.mapAdapter(); // Assuming googleRuntime exists
      orchestrator.mapController = new MapController(mapAdapter);
      await orchestrator.mapController.init(mapContainer.value);
      editorFacade.preview = new SuggestionPreviewController(orchestrator.mapController); // Wire up previewer
    }

    await loadOrderData(orderId.value);

  } catch (initError) {
    error.value = `Failed to initialize editor or map: ${initError.message}`;
    console.error(error.value, initError);
    if (!editorState.value.editor?.detail) {
      await loadOrderData(orderId.value); // Try loading order data anyway
    }
  }
});

onUnmounted(async () => {
  // Destroy map if mapController was initialized specifically for this view
  // If mapController is shared/global, destruction might happen elsewhere
  // if (mapController) {
  //     await mapController.destroy();
  // }
});

// Watch for route changes if the component is reused
watch(() => route.params.id, (newId) => {
  if (newId && newId !== orderId.value) {
    orderId.value = newId;
    loadOrderData(newId);
  }
});

</script>

<template>
  <div class="correction-editor">
    <h1>Correction Editor</h1>
    <div v-if="isLoading">Loading order...</div>
    <div v-if="error" class="error-message">Error: {{ error }}</div>

    <div v-if="!isLoading && !error && editorState.editor?.detail" class="editor-content">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {{ editorState.currentOrderId }}</p>
      <p><strong>Barcode:</strong> {{ editorState.editor.detail.barcode }}</p>
      <p><strong>Status:</strong> {{ editorState.editor.detail.processingStatus }}</p>

      <div class="address-sections">
        <section class="address-section pickup">
          <h3>Pickup Address</h3>
          <div class="address-comparison">
            <div class="address-column original">
              <h4>Original Input</h4>
              <pre>{{ editorState.editor.detail.originalPickup }}</pre>
            </div>
            <div class="address-column suggestions">
              <h4>Suggestions (TES/Google)</h4>
              <ul v-if="editorState.editor.detail.suggestedPickup?.length > 0">
                <li v-for="(sug, index) in editorState.editor.detail.suggestedPickup" :key="index">
                  <pre>{{ sug }}</pre>
                  <button @click="handleAcceptSuggestion('pickup', index)">Accept</button>
                </li>
              </ul>
              <p v-else>(No suggestions available)</p>
            </div>
            <div class="address-column editable">
              <h4>Editable / Corrected</h4>
              <form @submit.prevent>
                <label>Street: <input type="text" v-model="editablePickup.street"></label>
                <label>House No: <input type="text" v-model="editablePickup.houseNumber"></label>
                <label>Postal Code: <input type="text" v-model="editablePickup.postalCode"></label>
                <label>City: <input type="text" v-model="editablePickup.city"></label>
                <label>Country: <input type="text" v-model="editablePickup.country"></label>
              </form>
              <button @click="handleUseOriginal('pickup')">Use Original</button>
              <button @click="handleSave('pickup')" :disabled="isSaving">Save Pickup</button>
            </div>
          </div>
        </section>

        <section class="address-section delivery">
          <h3>Delivery Address</h3>
          <div class="address-comparison">
            <div class="address-column original">
              <h4>Original Input</h4>
              <pre>{{ editorState.editor.detail.originalDelivery }}</pre>
            </div>
            <div class="address-column suggestions">
              <h4>Suggestions (TES/Google)</h4>
              <ul v-if="editorState.editor.detail.suggestedDelivery?.length > 0">
                <li v-for="(sug, index) in editorState.editor.detail.suggestedDelivery" :key="index">
                  <p><strong>{{ sug.fullAddressLabel || `${sug.street || ''} ${sug.houseNumber || ''}, ${sug.postalCode || ''} ${sug.city || ''}` }}</strong></p>
                  <p>Source: {{sug.providerSource}}, Score: {{sug.matchScore?.toFixed(2)}}, Level: {{sug.matchLevel}}</p>
                  <button @click="handleAcceptSuggestion('delivery', index)">Accept</button>
                </li>
              </ul>
              <p v-else>(No suggestions available)</p>
            </div>
            <div class="address-column editable">
              <h4>Editable / Corrected</h4>
              <form @submit.prevent>
                <label>Street: <input type="text" v-model="editableDelivery.street"></label>
                <label>House No: <input type="text" v-model="editableDelivery.houseNumber"></label>
                <label>Postal Code: <input type="text" v-model="editableDelivery.postalCode"></label>
                <label>City: <input type="text" v-model="editableDelivery.city"></label>
                <label>Country: <input type="text" v-model="editableDelivery.country"></label>
                <p>Lat: {{ editableDelivery.latitude?.toFixed(6) || 'N/A' }}, Lon: {{ editableDelivery.longitude?.toFixed(6) || 'N/A' }}</p>
              </form>
              <button @click="handleUseOriginal('delivery')">Use Original</button>
              <button @click="handleSave('delivery')" :disabled="isSaving">Save Delivery</button>
            </div>
          </div>
        </section>
      </div>

      <section class="map-section">
        <h3>Map View</h3>
        <div ref="mapContainer" class="map-container">
        </div>
      </section>

      <div class="global-actions">
        <button @click="handleSave('both')" :disabled="isSaving">Save Both Addresses</button>
        <button @click="handleSaveAndNext" :disabled="isSaving">Save & Next</button>
        <button @click="router.push('/worklist')">Cancel</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.correction-editor { padding: 20px; }
.error-message { color: red; margin-bottom: 15px; }
.editor-content h2, .editor-content h3 { margin-bottom: 10px; }
.address-sections { display: flex; flex-direction: column; gap: 30px; margin-top: 20px; }
.address-section { border: 1px solid #eee; padding: 15px; border-radius: 5px; }
.address-comparison { display: flex; gap: 15px; }
.address-column { flex: 1; min-width: 0; } /* Allow shrinking */
.address-column h4 { margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
.address-column pre { background-color: #f8f8f8; padding: 10px; border-radius: 3px; font-size: 0.9em; white-space: pre-wrap; word-break: break-all; }
.address-column ul { list-style: none; padding: 0; margin: 0; }
.address-column li { border-bottom: 1px dashed #eee; padding-bottom: 10px; margin-bottom: 10px; }
.address-column li button { margin-left: 10px; }
.editable form label { display: block; margin-bottom: 8px; }
.editable form input { width: 95%; padding: 5px; margin-top: 3px; }
.map-section { margin-top: 30px; }
.map-container { height: 400px; width: 100%; border: 1px solid #ccc; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; }
.global-actions { margin-top: 30px; display: flex; gap: 10px; }
button:disabled { cursor: not-allowed; opacity: 0.6; }
</style>