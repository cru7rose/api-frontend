<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWorklistStore } from '@/stores/WorklistStore.js';
import api from '@/services/Api.js';

const router = useRouter();
const store = typeof useWorklistStore === 'function' ? useWorklistStore() : null;

/* Filters */
const filters = ref({
  customerId: '',
  status: 'PENDING_VERIFICATION',
  page: 0,
  size: 25,
  sort: 'ingestedAt,desc',
});

/* Local state (rename to avoid collisions) */
const isLoading      = ref(false);
const rows           = ref([]);
const pageNo         = ref(0);
const totalPagesNo   = ref(1);

/* Helpers */
const hasFn = (obj, name) => obj && typeof obj[name] === 'function';

async function callStore(params) {
  if (!store) return null;
  if (hasFn(store, 'fetch'))       return await store.fetch(params);
  if (hasFn(store, 'getWorklist')) return await store.getWorklist(params);
  if (hasFn(store, 'load'))        return await store.load(params);
  if (hasFn(store, 'list'))        return await store.list(params);
  if (hasFn(store, 'query'))       return await store.query(params);
  return null;
}

function mirrorStore() {
  if (!store) return;
  rows.value         = store.items ?? store.rows ?? store.data ?? [];
  pageNo.value       = Number(store.page ?? store.currentPage ?? 0) || 0;
  totalPagesNo.value = Number(store.totalPages ?? store.pages ?? 1) || 1;
}

async function fetchDirect(params) {
  const { customerId, status, page, size, sort } = params;
  const { data } = await api.get('/api/orders', {
    params: {
      customerId: customerId || undefined,
      status: status || undefined,
      page, size, sort,
    },
  });

  const content = Array.isArray(data?.content) ? data.content
      : Array.isArray(data?.items)   ? data.items
          : Array.isArray(data)          ? data
              : [];

  rows.value         = content;
  pageNo.value       = Number(data?.page ?? data?.number ?? 0) || 0;
  totalPagesNo.value = Number(data?.totalPages ?? 1) || 1;
}

async function reload() {
  isLoading.value = true;
  try {
    const params = {
      customerId: filters.value.customerId || undefined,
      status: filters.value.status || undefined,
      page: filters.value.page,
      size: filters.value.size,
      sort: filters.value.sort,
    };

    const usedStore = await callStore(params);
    if (usedStore !== null) mirrorStore();
    else await fetchDirect(params);
  } catch (e) {
    console.error('Worklist load failed:', e);
  } finally {
    isLoading.value = false;
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

        <tr v-if="!isLoading && rows.length === 0">
          <td colspan="8" class="py-12 text-center text-slate-400">No results.</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between text-sm text-slate-600">
      <div>Page {{ pageNo + 1 }} / {{ totalPagesNo }}</div>
      <div class="flex gap-2">
        <button
            class="btn-ghost"
            :disabled="pageNo <= 0"
            @click="filters.page = pageNo - 1; reload()"
        >
          Prev
        </button>
        <button
            class="btn-ghost"
            :disabled="pageNo >= totalPagesNo - 1"
            @click="filters.page = pageNo + 1; reload()"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input { @apply h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30; }
.btn-primary { @apply inline-flex items-center h-9 rounded-lg px-3 text-sm font-medium text-slate-900 bg-yellow-300 hover:bg-yellow-400 transition; }
.btn-ghost   { @apply inline-flex items-center h-9 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100; }
.btn-blue    { @apply inline-flex items-center h-8 rounded-md px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700; }
.th          { @apply text-left font-semibold px-4 py-3 bg-gradient-to-r from-yellow-50 to-blue-50 border-b border-slate-200; }
.td          { @apply px-4 py-3 align-top; }
.row         { @apply border-b border-slate-100 hover:bg-yellow-50/50 transition-colors; }
.addr .line  { @apply text-slate-900; }
.addr .muted { @apply text-slate-500 text-xs; }
</style>
