<!--
ARCHITECTURE: WorklistView lists ADDRESS_NEEDS_REVIEW orders with filters and navigation to the Editor.
It follows the manifesto by delegating business logic to WorklistFacade and keeping the component thin.
Responsibilities:
- Initialize WorklistFacade, load a page, render filter controls and a simple grid.
- Navigate to CorrectionEditorView with context; support selection and export actions.
-->
<template>
  <section class="worklist">
    <header class="wl-header">
      <h1>Address Exception Worklist</h1>
      <div class="filters">
        <input v-model="state.filters.query" placeholder="Search (Order ID / Customer)" />
        <select v-model="state.filters.source">
          <option :value="null">All Sources</option>
          <option value="API">API</option>
          <option value="AED_SFTP">AED SFTP</option>
          <option value="GATEWAY_SFTP">Gateway SFTP</option>
          <option value="CDC">CDC</option>
        </select>
        <button @click="applyFilters">Apply</button>
        <button @click="clearFilters">Clear</button>
        <button @click="togglePolling">{{ polling ? 'Stop Auto-Refresh' : 'Start Auto-Refresh' }}</button>
      </div>
    </header>

    <div class="toolbar">
      <button :disabled="!selectedIds.length" @click="exportSelected">Export Selected</button>
      <button @click="exportAll" :disabled="!items.length">Export All</button>
    </div>

    <div class="grid">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Source</th>
            <th>Error</th>
            <th>Status</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in items" :key="row.orderId" @dblclick="openEditor(row.orderId)">
            <td><input type="checkbox" :checked="selected.has(row.orderId)" @change="toggle(row.orderId)" /></td>
            <td>{{ row.orderId }}</td>
            <td>{{ row.customerName || '—' }}</td>
            <td>{{ row.source || '—' }}</td>
            <td>{{ row.errorType || '—' }}</td>
            <td>{{ row.processingStatus }}</td>
            <td>{{ row.updatedAt || '—' }}</td>
            <td><button @click="openEditor(row.orderId)">Open</button></td>
          </tr>
          <tr v-if="!items.length && !loading">
            <td colspan="8">No items.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="pager">
      <button :disabled="page<=1" @click="prevPage">Prev</button>
      <span>Page {{ page }} / {{ pages }}</span>
      <button :disabled="page>=pages" @click="nextPage">Next</button>
    </footer>
  </section>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from "vue";
import { WorklistFacade } from "@/controllers/WorklistFacade";
import { WorklistExportController } from "@/controllers/WorklistExportController";
import { EditorNavigationController } from "@/controllers/EditorNavigationController";

const orchestrator = inject("orchestrator");
const nav = new EditorNavigationController();
const facade = orchestrator ? orchestrator.getWorklist() : new WorklistFacade();
const exporter = new WorklistExportController();

const state = reactive({
  loading: false,
  error: null,
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  filters: { query: "", source: null, errorTypes: [], confidenceMin: 0, confidenceMax: 100 },
});
const polling = ref(false);
const selected = ref(new Set());

const items = computed(() => state.items);
const page = computed(() => state.page);
const pages = computed(() => Math.max(1, Math.ceil(state.total / state.pageSize)));
const selectedIds = computed(() => Array.from(selected.value.values()));
const allSelected = computed(() => items.value.length && selectedIds.value.length === items.value.length);
const loading = computed(() => state.loading);

function syncSnapshot(snap) {
  state.loading = snap.store.loading;
  state.error = snap.store.error;
  state.items = snap.store.items;
  state.total = snap.store.total;
  state.page = snap.store.page;
  state.pageSize = snap.store.pageSize;
  state.filters = snap.store.filters;
}

async function load() {
  const r = await facade.initAndLoad(state.filters);
  if (r.ok) syncSnapshot(r.value);
}

function applyFilters() {
  facade.initAndLoad(state.filters).then(r => r.ok && syncSnapshot(r.value));
}

function clearFilters() {
  state.filters = { query: "", source: null, errorTypes: [], confidenceMin: 0, confidenceMax: 100 };
  applyFilters();
}

function togglePolling() {
  if (polling.value) {
    facade.stopPolling();
  } else {
    facade.startPolling(10000);
  }
  polling.value = !polling.value;
}

function prevPage() {
  state.page = Math.max(1, state.page - 1);
  facade.store.setPage(state.page);
  facade.store.loadPage().then(r => r.ok && syncSnapshot(facade.snapshot()));
}

function nextPage() {
  state.page = Math.min(pages.value, state.page + 1);
  facade.store.setPage(state.page);
  facade.store.loadPage().then(r => r.ok && syncSnapshot(facade.snapshot()));
}

function toggle(id) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
}

function toggleAll(e) {
  if (e.target.checked) {
    selected.value = new Set(items.value.map(r => r.orderId));
  } else {
    selected.value = new Set();
  }
}

function exportSelected() {
  exporter.exportSelected(items.value, selectedIds.value);
}

function exportAll() {
  exporter.exportAll(items.value);
}

function openEditor(orderId) {
  const url = nav.toEditor(orderId, "worklist", state.filters);
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

onMounted(load);
</script>

<style scoped>
.worklist { padding: 16px; display: grid; gap: 12px; }
.wl-header { display: grid; gap: 8px; }
.filters { display: flex; gap: 8px; align-items: center; }
.toolbar { display: flex; gap: 8px; }
.grid { overflow: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 14px; }
.pager { display: flex; gap: 8px; align-items: center; justify-content: center; padding: 8px; }
</style>
