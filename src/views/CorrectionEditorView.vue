<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Address } from '@/domain/WorkbenchModels';
import { AddressFormatterService } from '@/services/AddressFormatterService';
import { AddressExceptionApi } from '@/services/AddressExceptionApi';
import { GeocodeWithCacheController } from '@/controllers/GeocodeWithCacheController';
import { MapController } from '@/controllers/MapController';
import StatusBadge from '@/components/common/StatusBadge.vue';
import ActionButton from '@/components/common/ActionButton.vue';
import AddressDisplay from '@/components/editor/AddressDisplay.vue';
import AddressEditor from '@/components/editor/AddressEditor.vue';

const geoRuntime = inject('geoRuntime', null);
const showNotification = inject('showNotification', null);

const route = useRoute();
const router = useRouter();

const orderId = ref(route.params.id);
const isLoading = ref(true);
const error = ref(null);

const formatter = new AddressFormatterService();
const api = new AddressExceptionApi();
let mapController = null;
let geocodeController = null;
let editorFacade = null;

const orderDetail = ref(null);
const editedPickup = ref(new Address());
const editedDelivery = ref(new Address());

const hasPickupChanged = computed(() =>
    orderDetail.value
        ? JSON.stringify(orderDetail.value.originalPickup ?? {}) !== JSON.stringify(editedPickup.value ?? {})
        : false);
const hasDeliveryChanged = computed(() =>
    orderDetail.value
        ? JSON.stringify(orderDetail.value.originalDelivery ?? {}) !== JSON.stringify(editedDelivery.value ?? {})
        : false);
const hasAnyChanged = computed(() => hasPickupChanged.value || hasDeliveryChanged.value);

const mapContainer = ref(null);

const streetSuggestions = ref([]);
const streetLoading = ref(false);
let streetDebounceTimer = null;

const safeNum = (v) => (v === 0 || (typeof v === 'number' && Number.isFinite(v))) ? v : null;
const hasLatLon = (obj) => obj && safeNum(+obj.latitude) !== null && safeNum(+obj.longitude) !== null;

const updateMapMarkers = async () => {
  if (!mapController || !mapController._ready) return;

  const pk = editedPickup.value || {};
  const dl = editedDelivery.value || {};

  let pkPos = null, dlPos = null;

  if (hasLatLon(pk)) {
    pkPos = { lat: +pk.latitude, lon: +pk.longitude };
    await mapController.updatePickupMarker(pkPos.lat, pkPos.lon);
  } else { mapController.clearPickupMarker?.(); }

  if (hasLatLon(dl)) {
    dlPos = { lat: +dl.latitude, lon: +dl.longitude };
    await mapController.updateDeliveryMarker(dlPos.lat, dlPos.lon);
  } else { mapController.clearDeliveryMarker?.(); }

  if (pkPos && dlPos) await mapController.drawRouteAndFit(pkPos, dlPos);
  else if (pkPos)     await mapController.setCenter(pkPos.lat, pkPos.lon, 14);
  else if (dlPos)     await mapController.setCenter(dlPos.lat, dlPos.lon, 14);
};

const loadOrder = async (id) => {
  isLoading.value = true;
  error.value = null;
  try {
    if (!editorFacade) throw new Error('Editor facade not initialized.');

    const result = await editorFacade.load(id);
    if (!result?.ok) throw (result?.error ?? new Error('Load failed.'));

    const detail = result.value || {};
    orderDetail.value = detail;

    editedPickup.value = new Address(detail.originalPickup || {});
    editedDelivery.value = new Address(detail.originalDelivery || {});

    await updateMapMarkers(); // map already ready at this point
  } catch (e) {
    console.error(e);
    error.value = e?.message || 'Failed to load order details.';
  } finally {
    isLoading.value = false;
  }
};

const handleGeocode = async (side) => {
  const model = side === 'pickup' ? editedPickup.value : editedDelivery.value;
  const result = await geocodeController.geocode(model);
  if (result && Number.isFinite(+result.latitude) && Number.isFinite(+result.longitude)) {
    model.latitude = +result.latitude;
    model.longitude = +result.longitude;
    showNotification?.(`Geocode successful for ${side}`, 'success');
    await updateMapMarkers();
  } else {
    showNotification?.(`Geocode failed for ${side}.`, 'error');
  }
};

const onStreetInput = (evt, side) => {
  const model = side === 'pickup' ? editedPickup.value : editedDelivery.value;
  const query = (evt?.target?.value || '').trim();
  if (query.length < 3 || !model?.postalCode || !model?.city) {
    streetSuggestions.value = [];
    return;
  }
  streetLoading.value = true;
  clearTimeout(streetDebounceTimer);
  streetDebounceTimer = setTimeout(async () => {
    try {
      const res = await api.getStreetsForPostalCode(model.postalCode, model.city);
      const list = res?.ok ? (res.value || []) : [];
      streetSuggestions.value = list
          .filter(s => (s?.value || '').toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
    } catch {
      streetSuggestions.value = [];
    } finally {
      streetLoading.value = false;
    }
  }, 300);
};

const selectStreetSuggestion = (s, side) => {
  if (!s) return;
  if (side === 'pickup') editedPickup.value.street = s.value;
  else editedDelivery.value.street = s.value;
  streetSuggestions.value = [];
};

const handleSave = async (side) => {
  isLoading.value = true;
  try {
    const payload = {
      orderId: orderId.value,
      side,
      resolution: 'MANUAL_EDIT',
      applyToSimilar: false,
      correctedPickup: (side === 'pickup' || side === 'both') ? editedPickup.value : null,
      correctedDelivery: (side === 'delivery' || side === 'both') ? editedDelivery.value : null,
    };
    const res = await api.saveCorrection(payload);
    if (res?.ok) {
      showNotification?.('Save successful!', 'success');
      await loadOrder(orderId.value);
    } else {
      const msg = res?.error?.message || 'Save failed';
      showNotification?.(msg, 'error'); error.value = msg;
    }
  } finally {
    isLoading.value = false;
  }
};

const handleResubmit = async () => {
  isLoading.value = true;
  try {
    const res = await api.resubmitOrder(orderId.value);
    if (res?.ok) {
      showNotification?.('Resubmitted for verification.', 'info');
      await loadOrder(orderId.value);
    } else {
      showNotification?.(res?.error?.message || 'Resubmit failed', 'error');
    }
  } finally { isLoading.value = false; }
};

onMounted(async () => {
  if (!geoRuntime) { error.value = 'Geo runtime is not provided. Ensure app.provide("geoRuntime", ...) in main.'; return; }

  // 1) Prepare controllers
  mapController = new MapController(geoRuntime.mapAdapter());
  geocodeController = new GeocodeWithCacheController(geoRuntime);

  const { IntegrationOrchestrator } = await import('@/controllers/IntegrationOrchestrator');
  const orchestrator = new IntegrationOrchestrator(geoRuntime, mapController);
  editorFacade = orchestrator.getEditor();

  // 2) Mount the map FIRST
  await nextTick(); // ensure <div ref="mapContainer"> exists
  if (mapContainer.value && !mapController._ready) {
    await mapController.init(mapContainer.value);
  }

  // 3) Now it’s safe to load order (orchestrator may draw immediately)
  await loadOrder(orderId.value);
});

onUnmounted(() => {
  try { mapController?.destroy?.(); } catch {}
  clearTimeout(streetDebounceTimer);
});

watch(() => route.params.id, async (id) => {
  orderId.value = id;
  await loadOrder(id);
});
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-4 py-6">
    <div class="flex items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Correction Editor</h1>
        <div class="mt-1 text-sm text-slate-500 flex gap-4">
          <span>Order: <span class="font-medium text-slate-700">{{ orderId }}</span></span>
          <span v-if="orderDetail?.barcode">Barcode: <span class="font-mono">{{ orderDetail.barcode }}</span></span>
        </div>
      </div>
      <router-link to="/worklist" class="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Back to Worklist
      </router-link>
    </div>

    <div v-if="isLoading && !orderDetail" class="py-16 text-center text-slate-400">Loading order…</div>
    <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
      {{ error }}
    </div>

    <div v-if="orderDetail" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-slate-900">Pickup Address</h2>
          <StatusBadge :status="orderDetail.pickupReasonCode || 'N/A'" />
        </div>

        <AddressDisplay title="Original Pickup" :address="orderDetail.originalPickup" :formatter="formatter" :show-coords="true" />
        <AddressDisplay class="mt-3" :title="orderDetail.pickupStoredLabel || 'Stored (TrackIT)'" :address="orderDetail.pickupStoredAddress" :formatter="formatter" :show-coords="true" />

        <AddressEditor class="mt-4" title="Edit Pickup" v-model:address="editedPickup"
                       :suggestions="streetSuggestions" :loading-suggestions="streetLoading"
                       @street-input="onStreetInput($event, 'pickup')"
                       @select-suggestion="selectStreetSuggestion($event, 'pickup')" />

        <div class="mt-4 flex flex-wrap gap-2">
          <ActionButton label="Geocode" :secondary="true" :disabled="isLoading" @click="handleGeocode('pickup')" />
          <ActionButton label="Save Pickup" :disabled="!hasPickupChanged || isLoading" class="button" @click="handleSave('pickup')" />
        </div>
      </section>

      <section class="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-slate-900">Delivery Address</h2>
          <StatusBadge :status="orderDetail.deliveryReasonCode || 'N/A'" />
        </div>

        <AddressDisplay title="Original Delivery" :address="orderDetail.originalDelivery" :formatter="formatter" :show-coords="true" />
        <AddressDisplay class="mt-3" :title="orderDetail.deliveryStoredLabel || 'Stored (TrackIT)'" :address="orderDetail.deliveryStoredAddress" :formatter="formatter" :show-coords="true" />

        <AddressEditor class="mt-4" title="Edit Delivery" v-model:address="editedDelivery"
                       :suggestions="streetSuggestions" :loading-suggestions="streetLoading"
                       @street-input="onStreetInput($event, 'delivery')"
                       @select-suggestion="selectStreetSuggestion($event, 'delivery')" />

        <div class="mt-4 flex flex-wrap gap-2">
          <ActionButton label="Geocode" :secondary="true" :disabled="isLoading" @click="handleGeocode('delivery')" />
          <ActionButton label="Save Delivery" :disabled="!hasDeliveryChanged || isLoading" class="button" @click="handleSave('delivery')" />
        </div>
      </section>

      <section class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-sm">
        <h3 class="text-base font-semibold text-slate-900 mb-3">Map Preview</h3>
        <div ref="mapContainer" class="h-[400px] w-full bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500">
          Map is initializing…
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <ActionButton label="Save Both" :disabled="!hasAnyChanged || isLoading" class="button" @click="handleSave('both')" />
          <ActionButton label="Resubmit Verification" :disabled="isLoading" class="button secondary" @click="handleResubmit" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.button:not(.secondary) { background: #2563eb; color: #fff; }
.button.secondary { background: #fde047; color: #111827; }
</style>
