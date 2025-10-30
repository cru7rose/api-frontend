<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWorklistStore } from '@/stores/WorklistStore.js';
import api from '@/services/Api.js'; // same axios singleton we added

const router = useRouter();
const store = useWorklistStore?.() ?? {};

// ---- local reactive state ----
const filters = ref({
  customerId: '',
  status: 'PENDING_VERIFICATION',
  page: 0,
  size: 25,
  sort: 'ingestedAt,desc',
});

const loading    = ref(false);
const rows       = ref([]);
const page       = ref(0);
const totalPages = ref(1);

// ---- normalize store shape (adapter) ----
function hasFn(obj, name) { return obj && typeof obj[name] === 'function'; }

async function callStoreFetch(params) {
  // Try common method names in order
  if (hasFn(store, 'fetch'))       return await store.fetch(params);
  if (hasFn(store, 'getWorklist')) return await store.getWorklist(params);
  if (hasFn(store, 'load'))        return await store.load(params);
  if (hasFn(store, 'list'))        return await store.list(params);
  if (hasFn(store, 'query'))       return await store.query(params);
  return null; // signal fallback
}

function syncFromStore() {
  // Best-effort copy if the store exposes state
  rows.value       = (store.items ?? store.rows ?? store.data ?? []);
  page.value       = Number(store.page ?? store.currentPage ?? 0) || 0;
  totalPages.value = Number(store.totalPages ?? store.pages ?? 1) || 1;
}

// ---- fallback direct API (keeps /api prefix; nginx will forward to api.danxils.com/api) ----
async function fetchDirect(params) {
  const { customerId, status, page, size, sort } = params;
  const { data } = await api.get('/api/orders', {
    params: {
      customerId: customerId || undefined,
      status: status || undefined,
      page, size, sort,
    },
  });
  // Expecting Spring-style page response; adapt defensively
  const content    = data?.content ?? data?.items ?? data ?? [];
  rows.value       = Array.isArray(content) ? content : [];
  page.value       = Number(data?.page ?? data?.number ?? 0) || 0;
  totalPages.value = Number(data?.totalPages ?? 1) || 1;
}

// ---- public actions ----
async function reload() {
  loading.value = true;
  try {
    const params = {
      customerId: filters.value.customerId || undefined,
      status: filters.value.status || undefined,
      page: filters.value.page,
      size: filters.value.size,
      sort: filters.value.sort,
    };

    const usedStore = await callStoreFetch(params);
    if (usedStore !== null) {
      // store handled it — mirror its state if possible
      syncFromStore();
    } else {
      // no store method — fetch directly
      await fetchDirect(params);
    }
  } catch (e) {
    console.error('Worklist load failed:', e);
    // keep old rows and show a gentle toast if you have one
  } finally {
    loading.value = false;
  }
}

async function reset() {
  filters.value.customerId = '';
  filters.value.status = 'PENDING_VERIFICATION';
  filters.value.page = 0;
  await reload();
}

function openEditor(id) {
  router.push({ name: 'editor', params: { id } });
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

onMounted(reload);
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-4 py-6">
    <header class="flex items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-semibold text-slate-900">Worklist</h1>
      <div class="flex items-center gap-2">
        <input v-model="filters.customerId" type="text" placeholder="Customer ID…" class="input" />
        <select v-model="filters.status" class="input">
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
          <option value="">Any</option>
        </select>
        <button class="btn-primary" @click="reload">Apply Filters</button>
        <button class="btn-ghost" @click="reset">Reset</button>
      </div>
    </header>

    <div class="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
        <tr class="text-slate-700">
          <th class="th">Pickup</th>
          <th class="th">Delivery</th>
          <th class="th">Barcode</th>
          <th class="th">Customer ID</th>
          <th class="th">Status</th>
          <th class="th">Created</th>
          <th class="th">Updated</th>
          <th class="th text-right">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in rows" :key="r.id" class="row">
          <td class="td">
            <div class="addr">
              <div class="line">
                {{ r?.originalPickup?.street || '—' }} {{ r?.originalPickup?.houseNo || '' }}
              </div>
              <div class="muted">
                {{ r?.originalPickup?.postalCode || '' }} {{ r?.originalPickup?.city || '' }}
              </div>
            </div>
          </td>
          <td class="td">
            <div class="addr">
              <div class="line">
                {{ r?.originalDelivery?.street || '—' }} {{ r?.originalDelivery?.houseNo || '' }}
              </div>
              <div class="muted">
                {{ r?.originalDelivery?.postalCode || '' }} {{ r?.originalDelivery?.city || '' }}
              </div>
            </div>
          </td>
          <td class="td font-mono">{{ r?.barcode }}</td>
          <td class="td">{{ r?.customerId }}</td>
          <td class="td">
              <span class="status" :data-variant="r?.processingStatus || 'UNKNOWN'">
                {{ r?.processingStatus || 'UNKNOWN' }}
              </span>
          </td>
          <td class="td">{{ formatDate(r?.ingestedAt) }}</td>
          <td class="td">{{ formatDate(r?.updatedAt) }}</td>
          <td class="td text-right">
            <button class="btn-blue" @click="openEditor(r.id)">Open</button>
          </td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
          <td colspan="8" class="py-12 text-center text-slate-400">No results.</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm text-slate-600">
      <div>Page {{ page + 1 }} / {{ totalPages }}</div>
      <div class="flex gap-2">
        <button class="btn-ghost" :disabled="page <= 0" @click="filters.page = page - 1; reload()">Prev</button>
        <button class="btn-ghost" :disabled="page >= totalPages - 1" @click="filters.page = page + 1; reload()">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input {
  @apply h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30;
}
.btn-primary { @apply inline-flex items-center h-9 rounded-lg px-3 text-sm font-medium text-slate-900 bg-yellow-300 hover:bg-yellow-400 transition; }
.btn-ghost   { @apply inline-flex items-center h-9 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100; }
.btn-blue    { @apply inline-flex items-center h-8 rounded-md px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700; }
.th          { @apply text-left font-semibold px-4 py-3 bg-gradient-to-r from-yellow-50 to-blue-50 border-b border-slate-200; }
.td          { @apply px-4 py-3 align-top; }
.row         { @apply border-b border-slate-100 hover:bg-yellow-50/50 transition-colors; }
.addr .line  { @apply text-slate-900; }
.addr .muted { @apply text-slate-500 text-xs; }
</style>
