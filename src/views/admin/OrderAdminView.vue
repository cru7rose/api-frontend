<template>
  <div class="admin-order-view p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Order Administration Tool</h1>
    <p class="text-gray-600 mb-6">
      This tool allows administrators to view all order shadows in the database and manually change their processing status.
      Use with caution.
    </p>

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
      <p class="mt-1 text-sm text-slate-500">The database contains no order shadow records.</p>
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
          <th @click="store.setSort('lastUpdatedAt')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">
            Last Updated <span v-html="sortIcon('lastUpdatedAt')"></span>
          </th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Change Status
          </th>
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
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ formatDate(order.updatedAt) }}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm">
            <div class="flex gap-2">
              <select v-model="statusChange[order.id]" class="form-select">
                <option disabled value="">Select new status...</option>
                <option v-for="status in allStatuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
              <button
                  @click="handleChangeStatus(order.id)"
                  :disabled="store.loading || !statusChange[order.id] || statusChange[order.id] === order.processingStatus"
                  class="button-secondary text-xs"
                  title="Apply status change">
                Apply
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

// Statuses from the backend enum
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

// Local state for the dropdowns, keyed by order ID
const statusChange = ref({});

onMounted(() => {
  store.fetchAllOrders();
});

const handleChangeStatus = (orderId) => {
  const newStatus = statusChange.value[orderId];
  if (!newStatus) {
    toast.warn("Please select a new status first.");
    return;
  }

  if (confirm(`Are you sure you want to change status for order ${orderId} to ${newStatus}?`)) {
    store.changeOrderStatus(orderId, newStatus).then(() => {
      // Clear the dropdown selection for this row on success
      statusChange.value[orderId] = "";
    });
  }
};

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
}

.button-secondary {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}
.button-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}
.button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.text-xs {
  font-size: 0.75rem;
}
</style>