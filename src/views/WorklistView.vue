<script setup>
/**
 * ARCHITECTURE: WorklistView displays the filterable grid of orders needing address review.
 * It utilizes WorklistFacade for data loading, state management, and polling control.
 * Responsibilities:
 * - Render filter controls and trigger facade methods on change.
 * - Display the list of orders (items) from the facade's snapshot.
 * - Handle pagination based on facade's state.
 * - Provide navigation links to the CorrectionEditorView for selected orders.
 */
import { ref, onMounted, onUnmounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { EditorNavigationController } from '@/controllers/EditorNavigationController'; // For building editor links

// --- State ---
const orchestrator = inject('orchestrator'); // Provided in main.js
const worklistFacade = orchestrator.getWorklist(); // Get shared facade instance
const router = useRouter();
const navigation = new EditorNavigationController();

const worklistState = ref(worklistFacade.snapshot()); // Reactive snapshot
const isLoading = ref(false);
const error = ref(null);

// --- Methods ---
async function loadData() {
  isLoading.value = true;
  error.value = null;
  const result = await worklistFacade.initAndLoad(/* pass initial filters if needed */);
  if (result.ok) {
    worklistState.value = worklistFacade.snapshot();
  } else {
    error.value = result.error?.message || 'Failed to load worklist';
  }
  isLoading.value = false;
}

function handleFilterChange(newFilters) {
  // Update facade filters and reload
  worklistFacade.store.setFilterPatch(newFilters);
  loadData(); // Reload with new filters
}

function goToEditor(orderId) {
  if (!orderId) return;
  const route = navigation.toEditor(orderId, 'worklist', worklistState.value.store.filter);
  router.push(route);
}

function updateState() {
  // Non-async update from facade for polling changes
  worklistState.value = worklistFacade.snapshot();
}

// --- Lifecycle ---
onMounted(async () => {
  await loadData();
  worklistFacade.startPolling(15000); // Start polling every 15 seconds

  // Subscribe to polling updates (if polling service provides an event mechanism)
  // Alternatively, periodically call updateState() if no events
  const pollInterval = setInterval(updateState, 5000); // Simple refresh from snapshot
  onUnmounted(() => clearInterval(pollInterval));
});

onUnmounted(() => {
  worklistFacade.stopPolling();
});

</script>

<template>
  <div class="worklist-view">
    <h1>Address Exception Worklist</h1>

    <div class="filters">
      <p>(Filter controls placeholder - implement filters based on backend capabilities)</p>
    </div>

    <div v-if="isLoading">Loading orders...</div>
    <div v-if="error" class="error-message">Error loading worklist: {{ error }}</div>

    <table v-if="!isLoading && !error && worklistState.store.items.length > 0">
      <thead>
      <tr>
        <th>Order ID</th>
        <th>Barcode</th>
        <th>Customer ID</th>
        <th>Status</th>
        <th>Created At</th>
        <th>Updated At</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in worklistState.store.items" :key="item.id">
        <td>{{ item.id }}</td>
        <td>{{ item.barcode }}</td>
        <td>{{ item.customerId }}</td>
        <td>{{ item.processingStatus }}</td>
        <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A' }}</td>
        <td>{{ item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A' }}</td>
        <td>
          <button @click="goToEditor(item.id)">Review</button>
        </td>
      </tr>
      </tbody>
    </table>
    <div v-else-if="!isLoading && !error">
      No orders found needing review.
    </div>

    <div class="pagination">
      <p>(Pagination controls placeholder - connect to worklistState.store.filter and loadData)</p>
      <span>Total Items: {{ worklistState.store.total }}</span>
    </div>
  </div>
</template>

<style scoped>
.worklist-view { padding: 20px; }
.filters, .pagination { margin-bottom: 15px; }
.error-message { color: red; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
button { cursor: pointer; }
</style>