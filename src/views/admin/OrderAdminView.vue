<template>
  <div class="admin-order-view p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Order Administration Tool</h1>
    <p class="text-gray-600 mb-6">
      This tool allows administrators to view all order shadows in the database and manually change their processing status.
      Use with caution.
    </p>

    <div class="filters-container bg-white rounded-xl shadow-lg p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-700 mb-3">Filters</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <div class="form-group">
          <label for="filter-barcode" class="form-label">Barcode</label>
          <input
              id="filter-barcode"
              type="text"
              v-model="store.filters.barcode"
              placeholder="Filter by barcode..."
              class="form-input"
              @keyup.enter="store.applyFilters"
          />
        </div>

        <div class="form-group">
          <label for="filter-source" class="form-label">Source System</label>
          <input
              id="filter-source"
              type="text"
              v-model="store.filters.source"
              placeholder="e.g., API, WMS, CDC"
              class="form-input"
              @keyup.enter="store.applyFilters"
          />
        </div>

        <div class="form-group">
          <label for="filter-status" class="form-label">Status</label>
          <select id="filter-status" v-model="store.filters.status" class="form-input">
            <option value="">All Statuses</option>
            <option v-for="s in allStatuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="filter-date-from" class="form-label">Ingested From</label>
          <input
              id="filter-date-from"
              type="date"
              v-model="store.filters.dateFrom"
              class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="filter-date-to" class="form-label">Ingested To</label>
          <input
              id="filter-date-to"
              type="date"
              v-model="store.filters.dateTo"
              class="form-input"
          />
        </div>

      </div>
      <div class="flex gap-3 mt-4 justify-end">
        <button
            @click="store.resetFilters"
            :disabled="store.loading"
            class="button-secondary">
          Reset Filters
        </button>
        <button
            @click="store.applyFilters"
            :disabled="store.loading"
            class="button-primary">
          {{ store.loading ? 'Searching...' : 'Search' }}
        </button>
      </div>
    </div>
    <div v-if="store.loading && !store.orders.length" class="text-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
      <p class="text-lg text-slate-500 mt-5">Loading all orders...</p>
    </div>

    <div v-else-if="store.error && !store.orders.length" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
      <strong class="font-bold">Error: </strong>
      <span>{{ store.error }}</span>
    </div>

    <div v-else-if="!store.orders.length" class="text-center py-16 bg-white rounded-xl shadow-md">
      <h3 class="mt-3 text-lg font-medium text-slate-800">No Orders Found</h3>
      <p class="mt-1 text-sm text-slate-500">No orders match the current filter criteria.</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-xl overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
        <tr>
          <th @click="store.setSort('barcode')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Barcode <span v-html="sortIcon('barcode')"></span>
          </th>
          <th @click="store.setSort('sourceSystem')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Source <span v-html="sortIcon('sourceSystem')"></span>
          </th>
          <th @click="store.setSort('processingStatus')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Status <span v-html="sortIcon('processingStatus')"></span>
          </th>
          <th @click="store.setSort('latestErrorMessage')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Error Message <span v-html="sortIcon('latestErrorMessage')"></span>
          </th>
          <th @click="store.setSort('lastUpdatedAt')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Last Updated <span v-html="sortIcon('lastUpdatedAt')"></span>
          </th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Actions </th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ID
          </th>
        </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
        <tr v-for="order in store.orders" :key="order.id" class="hover:bg-slate-50">
          <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-700">
            <router-link :to="`/editor/${order.id}`" class="hover:underline" :title="`Open editor for ${order.barcode}`">
              {{ order.barcode }}
            </router-link>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ order.sourceSystem }}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm">
            <StatusBadge :status="order.processingStatus" />
          </td>
          <td class="px-4 py-3 text-xs text-red-700 font-mono max-w-xs truncate" :title="order.latestErrorMessage">
            {{ order.latestErrorMessage }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ formatDate(order.updatedAt) }}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm">
            <div class="flex gap-2 items-center">
              <select v-model="statusChange[order.id]" class="form-select" title="Change status">
                <option disabled value="">Select new status...</option>
                <option v-for="status in adminSelectableStatuses(order.processingStatus)" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
              <button
                  @click="handleChangeStatus(order.id)"
                  :disabled="store.loading || !statusChange[order.id] || statusChange[order.id] === order.processingStatus"
                  class="button-secondary text-xs"
                  title="Apply status change">
                Apply
              </button>
              <button
                  @click="handleDelete(order.id, order.barcode)"
                  :disabled="store.loading"
                  class="button-danger text-xs"
                  title="Delete this order">
                Del
              </button>
            </div>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-400" :title="order.id">
            {{ order.id.substring(0, 8) }}...
          </td>
        </tr>
        </tbody>
      </table>

      <div class="py-3 px-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="text-xs text-slate-600">
          Page {{ store.pagination.currentPage + 1 }} / {{ store.pagination.totalPages }} ({{ store.pagination.totalItems }} orders)
        </div>
        <div class="flex space-x-1.5">
          <button @click="store.setPage(store.pagination.currentPage - 1)" :disabled="store.pagination.currentPage === 0 || store.loading"
                  class="button-secondary text-xs">
            Previous
          </button>
          <button @click="store.setPage(store.pagination.currentPage + 1)" :disabled="store.pagination.currentPage >= store.pagination.totalPages - 1 || store.loading"
                  class="button-secondary text-xs">
            Next
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminOrderStore } from '@/stores/adminOrderStore';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { useToast } from '@/composables/useToast';

const store = useAdminOrderStore();
const toast = useToast();

const allStatuses = [
  "INGESTED",
  "AWAITING_ALIAS_CHECK",
  "CDC_EVENT",
  "HAPPY_PATH_MATCHED",
  "PENDING_VERIFICATION",
  "APPROVED",
  "SENT_TO_TRACKIT",
  "ACK_TRACKIT",
  "FAILED"
];

const adminStatusOptions = [
  { value: "PENDING_VERIFICATION", label: "Reset to Pending Review" },
  { value: "FAILED", label: "Mark as Failed" },
  { value: "ACK_TRACKIT", label: "Mark as Completed (ACK_TRACKIT)" },
];

const statusChange = ref({});

onMounted(() => {
  store.applyFilters();
});

const adminSelectableStatuses = (currentStatus) => {
  return adminStatusOptions.filter(opt => {
    if (opt.value === currentStatus) return false;
    if (opt.value === "PENDING_VERIFICATION" && currentStatus === "PENDING_VERIFICATION") return false;
    return true;
  });
};

const handleChangeStatus = (orderId) => {
  const newStatus = statusChange.value[orderId];
  if (!newStatus) {
    toast.warn("Please select a new status first.");
    return;
  }

  if (confirm(`Are you sure you want to change status for order ${orderId} to ${newStatus}?`)) {
    store.changeOrderStatus(orderId, newStatus).then(() => {
      statusChange.value[orderId] = "";
    });
  }
};

// *** ADDED: Delete handler ***
const handleDelete = (orderId, barcode) => {
  if (confirm(`Are you sure you want to PERMANENTLY DELETE order ${barcode} (ID: ${orderId})?\n\nThis action cannot be undone.`)) {
    store.deleteOrder(orderId, barcode);
  }
};
// *** END ADDED ***

const sortIcon = (field) => {
  if (store.sort.field === field) {
    return store.sort.direction === 'ASC' ? '&#9650;' : '&#9660;';
  }
  return '';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'medium' });
};
</script>

<style scoped>
/* Scoped styles */
.form-select {
  padding: 0.3rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #fff;
  flex-shrink: 1; /* Allow select to shrink */
}

.button-primary, .button-secondary, .button-danger {
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.button-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.button-primary:hover:not(:disabled) {
  background-color: #004a9c;
}

.button-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}
.button-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

/* *** ADDED: Danger button style *** */
.button-danger {
  background-color: #fef2f2; /* red-50 */
  color: #b91c1c; /* red-700 */
  border-color: #fecaca; /* red-300 */
}
.button-danger:hover:not(:disabled) {
  background-color: #fee2e2; /* red-100 */
  color: #991b1b; /* red-800 */
}
/* *** END ADDED *** */


.button-primary:disabled, .button-secondary:disabled, .button-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.text-xs {
  font-size: 0.75rem;
}
.max-w-xs {
  max-width: 20rem; /* 320px */
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>