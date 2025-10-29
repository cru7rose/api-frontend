<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorklistStore } from '@/stores/worklistStore';
import { storeToRefs } from 'pinia';
import { EditorNavigationController } from '@/controllers/EditorNavigationController';
import StatusBadge from '@/components/common/StatusBadge.vue';

const store = useWorklistStore();
const router = useRouter();
const nav = new EditorNavigationController();

// Use storeToRefs to keep reactivity on store state
const { items, pagination, loading, error, filter, selection } = storeToRefs(store);

// localFilter is now a reactive copy for the v-model bindings
const localFilter = ref({ ...filter.value.toPlainObject() });

// Watch for changes in the store's filter (e.g., after reset) and update local copy
watch(filter, (newFilterState) => {
  localFilter.value = { ...newFilterState.toPlainObject() };
}, { deep: true });

// Fetch data when component mounts
onMounted(async () => {
  await store.loadWorklistPage();
  // Ensure local filter is in sync with store after initial load
  localFilter.value = { ...store.filter.toPlainObject() };
});

// *** MODIFIED: Renamed to handle explicit button click ***
const handleApplyFilter = () => {
  // Pass the local state object to the store action
  store.applyFilterPatch(localFilter.value);
};

const handleResetFilter = () => {
  store.resetFilter(); // This will trigger the watcher to update localFilter.value
};

const goToEditor = (orderId) => {
  // Optional: Pass current filter/page state for 'Back' button context
  const navState = { filter: store.currentFilter, page: pagination.value.currentPage };
  router.push(nav.toEditor(orderId, 'worklist', navState));
};

// --- Selection Helpers ---
const isAllSelectedOnPage = computed(() => {
  const pageIds = items.value.map(item => item.id);
  return pageIds.length > 0 && pageIds.every(id => selection.value.includes(id));
});

const toggleSelectAll = () => {
  if (isAllSelectedOnPage.value) {
    store.clearSelection();
  } else {
    store.selectAllOnPage();
  }
};

// --- Pagination ---
const handlePageChange = (newPage) => {
  store.goToPage(newPage);
};

// Formatting helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

</script>

<template>
  <div class="worklist-view card">

    <div class="filter-controls">
      <input type="text" v-model="localFilter.barcode" placeholder="Barcode..." />
      <input type="text" v-model="localFilter.customerId" placeholder="Customer ID..." />
      <select v-model="localFilter.status">
        <option value="">All Statuses</option>
        <option value="ADDRESS_NEEDS_REVIEW">Needs Review</option>
        <option value="ADDRESS_VALIDATED">Validated</option>
        <option value="MANUALLY_CORRECTED">Corrected</option>
        <option value="PENDING_ADDRESS_VALIDATION">Pending</option>
        <option value="CDC_PROCESSED">CDC Processed</option>
        <option value="FAILED">Failed</option>
      </select>
      <input type="date" v-model="localFilter.dateFrom" title="Created Date From"/>
      <input type="date" v-model="localFilter.dateTo" title="Created Date To"/>

      <button @click="handleApplyFilter" class="button">Apply Filters</button>
      <button @click="handleResetFilter" class="button secondary">Reset Filters</button>
    </div>

    <div v-if="loading" class="loading-indicator">Loading worklist...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!loading && !error" class="worklist-content">
      <div class="table-actions">
        <span>Selected: {{ store.selectedCount }}</span>
      </div>

      <table class="worklist-table">
        <thead>
        <tr>
          <th><input type="checkbox" :checked="isAllSelectedOnPage" @change="toggleSelectAll" /></th>
          <th>Barcode</th>
          <th>Customer ID</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Updated At</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="items.length === 0">
          <td colspan="7">No orders found for the current filters.</td>
        </tr>
        <tr v-for="item in items" :key="item.id" :class="{ 'selected-row': store.isSelected(item.id) }">
          <td><input type="checkbox" :checked="store.isSelected(item.id)" @change="store.toggleSelection(item.id)" /></td>
          <td>{{ item.barcode }}</td>
          <td>{{ item.customerId }}</td>
          <td><StatusBadge :status="item.processingStatus" /></td>
          <td>{{ formatDate(item.createdAt) }}</td>
          <td>{{ formatDate(item.updatedAt) }}</td>
          <td>
            <button @click="goToEditor(item.id)" class="button">Open</button>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="pagination-controls" v-if="pagination.totalPages > 1">
        <button @click="handlePageChange(pagination.currentPage - 1)" :disabled="pagination.currentPage <= 1">Previous</button>
        <span>Page {{ pagination.currentPage }} of {{ pagination.totalPages }} ({{ pagination.totalItems }} items)</span>
        <button @click="handlePageChange(pagination.currentPage + 1)" :disabled="pagination.currentPage >= pagination.totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.worklist-view {
  /* Inherits card styles */
}

.filter-controls {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: var(--spacing-unit);
  margin-bottom: calc(var(--spacing-unit) * 2);
  padding-bottom: calc(var(--spacing-unit) * 2);
  border-bottom: 1px solid var(--color-border);
}

.filter-controls input,
.filter-controls select {
  padding: var(--spacing-unit);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  flex-grow: 1; /* Allow inputs to grow */
  min-width: 150px; /* Minimum width for inputs */
}
.filter-controls input[type="date"] {
  flex-grow: 0; /* Don't let date inputs grow too much */
}

.filter-controls button {
  flex-grow: 0; /* Don't let button grow */
}

.loading-indicator, .error-message {
  padding: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
  border-radius: 4px;
}
.loading-indicator { background-color: #f0f0f0; }
.error-message { background-color: var(--color-danger); color: white; }

.worklist-content {
  /* Styles for table and actions */
}

.table-actions {
  margin-bottom: var(--spacing-unit);
  color: var(--color-text-light);
}

.worklist-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.worklist-table th,
.worklist-table td {
  border: 1px solid var(--color-border);
  padding: var(--spacing-unit);
  text-align: left;
  vertical-align: middle;
}

.worklist-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.selected-row {
  background-color: #fff3cd; /* Light yellow for selected rows */
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-unit);
  margin-top: calc(var(--spacing-unit) * 2);
}
.pagination-controls button {
  padding: calc(var(--spacing-unit)*0.5) var(--spacing-unit);
  cursor: pointer;
}
.pagination-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.pagination-controls span {
  color: var(--color-text-light);
}
</style>