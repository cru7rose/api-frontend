<template>
  <div class="min-h-[calc(100vh-8rem)] bg-white">
    <!-- Header -->
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-xl bg-yellow-400 ring-2 ring-blue-600"></div>
          <h1 class="text-xl font-semibold text-slate-900">Correction Editor</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
              class="px-4 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition"
              :disabled="busy || !canSave"
              @click="saveAll"
          >
            {{ busy ? 'Saving…' : 'Save' }}
          </button>
          <button
              class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              @click="useOriginal"
          >
            Use Original
          </button>
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="mx-auto max-w-7xl px-4 py-6 grid gap-6 lg:grid-cols-2">
      <!-- Left: Edit Panels -->
      <section class="space-y-6">
        <!-- Editable Address -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 class="text-lg font-semibold mb-4 text-slate-900">Editable Address</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="text-sm">
              <span class="text-slate-600">Alias</span>
              <input class="input" v-model="editable.alias" />
            </label>
            <label class="text-sm">
              <span class="text-slate-600">Attention Name</span>
              <input class="input" v-model="editable.attentionName" />
            </label>
            <label class="text-sm sm:col-span-2">
              <span class="text-slate-600">Street</span>
              <input class="input" v-model="editable.street" @input="onInput('street', $event.target.value)" />
            </label>
            <label class="text-sm">
              <span class="text-slate-600">House No</span>
              <input class="input" v-model="editable.houseNo" @input="onInput('houseNo', $event.target.value)" />
            </label>
            <label class="text-sm">
              <span class="text-slate-600">Postal Code</span>
              <input class="input" v-model="editable.postalCode" @input="onInput('postalCode', $event.target.value)" />
            </label>
            <label class="text-sm">
              <span class="text-slate-600">City</span>
              <input class="input" v-model="editable.city" @input="onInput('city', $event.target.value)" />
            </label>
            <label class="text-sm">
              <span class="text-slate-600">Country</span>
              <input class="input" v-model="editable.country" @input="onInput('country', $event.target.value)" />
            </label>
          </div>
        </div>

        <!-- Dynamic Suggestions -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-slate-900">Suggestions</h2>
            <div class="flex gap-2">
              <input
                  class="input w-56"
                  placeholder="Find by place name…"
                  v-model="placeSearchQuery"
                  @input="debouncedNameSearch"
              />
              <button
                  class="px-3 py-2 rounded-xl text-slate-800 bg-white border border-slate-200 hover:bg-slate-50"
                  :disabled="isLoadingSuggestions"
                  @click="getDynamicSuggestionsByAddress"
              >
                {{ isLoadingSuggestions ? 'Searching…' : 'Search by Address' }}
              </button>
            </div>
          </div>

          <div v-if="isLoadingSuggestions" class="text-sm text-slate-600">Loading suggestions…</div>
          <ul v-else class="divide-y divide-slate-100">
            <li
                v-for="(s, idx) in suggestions"
                :key="idx"
                class="py-3 flex items-center justify-between"
            >
              <div class="text-sm">
                <div class="font-medium text-slate-900">{{ s.fullAddressLabel || formatSuggestion(s) }}</div>
                <div class="text-slate-500">
                  Score: {{ s.matchScore?.toFixed(2) || 'N/A' }}, Level: {{ s.matchLevel || 'N/A' }}, Source: {{ s.providerSource || 'N/A' }}
                </div>
              </div>
              <button class="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-900"
                      @click="selectDynamicSuggestion(s)">
                Use
              </button>
            </li>
          </ul>
          <p v-if="!isLoadingSuggestions && suggestions.length===0" class="text-sm text-slate-500">No suggestions.</p>
        </div>

        <!-- Diff Snapshot -->
        <AddressDiffCard
            title="Snapshot"
            :address="editable"
            :stored-address="stored"
            stored-label="Stored (TrackIT)"
            class="bg-white border border-slate-200 rounded-2xl"
        />
      </section>

      <!-- Right: Map & Actions -->
      <section class="space-y-6">
        <CorrectionMap
            :address="editable"
            :center="{ lat: Number(editable.latitude) || 52.2319, lng: Number(editable.longitude) || 21.0067 }"
            :zoom="13"
            @geocode="handleGeocode"
        />
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
          <button
              class="w-full px-4 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition"
              :disabled="busy"
              @click="geocodeCurrent"
          >
            {{ busy ? 'Geocoding…' : 'Geocode Address' }}
          </button>
          <button
              class="w-full px-4 py-2 rounded-xl text-slate-800 bg-white border border-slate-200 hover:bg-slate-50"
              :disabled="busy"
              @click="verifyViaJob"
          >
            Verify via Job Queue
          </button>
        </div>
      </section>
    </div>

    <!-- Modal: Async Verification Flow -->
    <BaseModal :is-open="modal.open" @close="closeModal">
      <template #title>Verification</template>
      <template #default>
        <div class="space-y-3">
          <p v-if="modal.status==='PENDING'">Waiting for results…</p>
          <p v-if="modal.error" class="text-red-600">Błąd: {{ modal.error }}</p>

          <ul v-if="modal.status==='COMPLETED' && modal.suggestions.length">
            <li
                v-for="(s, i) in modal.suggestions"
                :key="i"
                class="p-2 rounded cursor-pointer hover:bg-slate-50"
                :class="{ 'bg-amber-100' : modal.selected === s }"
                @click="modal.selected = s"
            >
              {{ s.fullAddressLabel }}
            </li>
          </ul>
          <p v-else-if="modal.status==='COMPLETED'" class="text-slate-600">Brak sugestii.</p>
        </div>
      </template>
      <template #footer>
        <button class="px-3 py-2 rounded-xl border border-slate-200" @click="closeModal">Close</button>
        <button
            class="px-3 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
            :disabled="!modal.selected || modal.busy"
            @click="submitCorrection"
        >
          Apply
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/services/Api.js';
import CorrectionMap from '@/components/CorrectionMap.vue';
import AddressDiffCard from '@/components/AddressDiffCard.vue';
import BaseModal from '@/components/Shared/BaseModal.vue';

const route = useRoute();
const orderId = String(route.params.id || '');

const stored = ref(null);
const editable = reactive({
  alias: '', attentionName: '',
  street: '', houseNo: '', postalCode: '', city: '', country: 'Polska',
  latitude: '', longitude: ''
});

const busy = ref(false);
const canSave = ref(true);

/* ----------------------- Suggestions (address/name) ----------------------- */
const suggestions = ref([]);
const isLoadingSuggestions = ref(false);
const placeSearchQuery = ref('');
let debounceTimer = null;

function formatSuggestion(s) {
  const parts = [s.street, s.houseNumber, s.postalCode, s.city].filter(Boolean);
  return parts.join(' ');
}

function updateField(field, value) { editable[field] = value; }

const onInput = (field, value) => {
  updateField(field, value);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { getDynamicSuggestionsByAddress(); }, 600);
};

const getDynamicSuggestionsByAddress = async () => {
  const query = {
    street: editable.street,
    houseNumber: editable.houseNo,
    postalCode: editable.postalCode,
    city: editable.city,
    country: 'Polska'
  };
  if (Object.values(query).every(v => !v || String(v).trim() === '')) {
    suggestions.value = [];
    return;
  }
  isLoadingSuggestions.value = true;
  try {
    const { data } = await apiClient.post('/api/suggest/address', query);
    suggestions.value = Array.isArray(data) ? data : [];
  } finally {
    isLoadingSuggestions.value = false;
  }
};

const getDynamicSuggestionsByName = async () => {
  if (!placeSearchQuery.value?.trim()) return;
  isLoadingSuggestions.value = true;
  try {
    const { data } = await apiClient.get('/api/suggest/name', { params: { q: placeSearchQuery.value } });
    suggestions.value = Array.isArray(data) ? data : [];
  } finally {
    isLoadingSuggestions.value = false;
  }
};

const debouncedNameSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(getDynamicSuggestionsByName, 600);
};

const selectDynamicSuggestion = (s) => {
  Object.assign(editable, {
    ...editable,                            // ✅ valid spread
    street: s.street || '',
    houseNo: s.houseNumber || '',
    postalCode: s.postalCode || '',
    city: s.city || '',
  });
  placeSearchQuery.value = s.fullAddressLabel || '';
  suggestions.value = [];
};

/* ------------------------------ Map/Geocode ------------------------------- */
const handleGeocode = (coords) => {
  editable.latitude = String(coords.lat ?? '');
  editable.longitude = String(coords.lng ?? '');
};

const geocodeCurrent = async () => {
  busy.value = true;
  try {
    const { data } = await apiClient.post('/api/geocode', {
      street: editable.street, houseNo: editable.houseNo,
      postalCode: editable.postalCode, city: editable.city, country: editable.country
    });
    if (data?.lat && data?.lng) {
      editable.latitude = String(data.lat);
      editable.longitude = String(data.lng);
    }
  } finally {
    busy.value = false;
  }
};

/* ----------------------------- Verify via Job ----------------------------- */
const modal = reactive({ open:false, status:'IDLE', jobId:null, suggestions:[], selected:null, error:'', busy:false });

const verifyViaJob = async () => {
  modal.open = true;
  modal.status = 'PENDING';
  modal.error = '';
  try {
    const { data } = await apiClient.post(`/api/address-verification/start/${orderId}`);
    modal.jobId = data?.verificationJobId;
    await pollJob();
  } catch {
    modal.error = 'Nie udało się rozpocząć procesu weryfikacji.';
    modal.status = 'FAILED';
  }
};

async function pollJob() {
  let attempts = 0;
  const maxAttempts = 20;
  while (attempts++ < maxAttempts) {
    await new Promise(r => setTimeout(r, 1500));
    const { data } = await apiClient.get(`/api/address-verification/status/${modal.jobId}`);
    if (!data?.status) continue;
    if (data.status === 'COMPLETED') {
      modal.status = 'COMPLETED';
      modal.suggestions = data.suggestions || [];
      return;
    }
    if (data.status === 'FAILED') {
      modal.status = 'FAILED';
      modal.error = 'Weryfikacja nie powiodła się.';
      return;
    }
  }
  modal.status = 'FAILED';
  modal.error = 'Przekroczono limit oczekiwania.';
}

const submitCorrection = async () => {
  if (!modal.selected) return;
  modal.busy = true;
  try {
    await apiClient.post(`/api/orders/${orderId}/address`, {
      ...editable,
      street: modal.selected.street || editable.street,
      houseNo: modal.selected.houseNumber || editable.houseNo,
      postalCode: modal.selected.postalCode || editable.postalCode,
      city: modal.selected.city || editable.city
    });
    modal.open = false;
  } finally {
    modal.busy = false;
  }
};

const closeModal = () => { modal.open = false; };

/* -------------------------------- Actions -------------------------------- */
const saveAll = async () => {
  busy.value = true;
  try {
    await apiClient.post(`/api/orders/${orderId}/address`, { ...editable });
  } finally {
    busy.value = false;
  }
};

const useOriginal = async () => {
  // Reload from backend saved/original
  const { data } = await apiClient.get(`/api/orders/${orderId}/original-address`);
  Object.assign(editable, data || {});
};
</script>

<style scoped>
.input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition text-sm;
}
.input:focus { box-shadow: 0 0 0 3px rgba(30,78,140,.25); border-color: #1e4e8c; }
</style>
