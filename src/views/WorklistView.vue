<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWorklistStore } from '@/stores/WorklistStore.js';

const router = useRouter();
const store = useWorklistStore();

const filters = ref({
  customerId: '',
  status: 'PENDING_VERIFICATION',
  page: 0,
  size: 25,
  sort: 'ingestedAt,desc'
});

const loading = computed(() => store.loading);
const rows = computed(() => store.items || []);
const page = computed(() => store.page || 0);
const totalPages = computed(() => store.totalPages || 1);

const reload = async () => {
  await store.fetch({
    customerId: filters.value.customerId || undefined,
    status: filters.value.status || undefined,
    page: filters.value.page,
    size: filters.value.size,
    sort: filters.value.sort
  });
};
const reset = async () => {
  filters.value.customerId = '';
  filters.value.status = 'PENDING_VERIFICATION';
  filters.value.page = 0;
  await reload();
};

const openEditor = (id) => router.push({ name: 'editor', params: { id } });

const formatDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

onMounted(reload);
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-4 py-6">
    <header class="flex items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-semibold text-slate-900">Worklist</h1>
      <div class="flex items-center gap-2">
        <input
            v-model="filters.customerId"
            type="text"
            placeholder="Customer ID…"
            class="input"
        />
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
      <table class="min-w-full text-sm">
        <thead class="bg-gradient-to-r from-yellow-50 to-blue-50 border-b border-slate-200">
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

    <!-- Pagination (simple) -->
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
.btn-primary {
  @apply inline-flex items-center h-9 rounded-lg px-3 text-sm font-medium text-slate-900 bg-yellow-300 hover:bg-yellow-400 transition;
}
.btn-ghost {
  @apply inline-flex items-center h-9 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100;
}
.btn-blue {
  @apply inline-flex items-center h-8 rounded-md px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700;
}
.th { @apply text-left font-semibold px-4 py-3; }
.td { @apply px-4 py-3 align-top; }
.row { @apply border-b border-slate-100 hover:bg-yellow-50/50 transition-colors; }
.addr .line { @apply text-slate-900; }
.addr .muted { @apply text-slate-500 text-xs; }
.status {
  @apply inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border;
  border-color: rgb(226 232 240);
}
.status[data-variant="NEEDS_REVIEW"] { @apply bg-yellow-50 text-yellow-700; }
.status[data-variant="PENDING_VERIFICATION"] { @apply bg-blue-50 text-blue-700; }
</style>
