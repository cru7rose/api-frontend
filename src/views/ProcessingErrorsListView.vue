<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useProcessingErrorsStore } from '@/stores/processingErrorsStore'; // *** CORRECT IMPORT ***
// import ErrorDetailsModal from '@/components/modals/ErrorDetailsModal.vue'; // Keep if you have this component
import StatusBadge from '@/components/common/StatusBadge.vue'; // Import StatusBadge

const errorStore = useProcessingErrorsStore(); // *** USE CORRECT STORE ***

// Use storeToRefs to keep reactivity
const { errors, pagination, isLoading, error } = storeToRefs(errorStore);

const currentSelectedErrorId = ref(null);
const showModal = ref(false);
// Local filter state (if you add filters)
const localFilters = ref({
  barcode: '',
  errorType: '',
  // ... other filters
});

const fetchErrors = async (page = 0) => {
  const filterParams = {
    page: page,
    size: pagination.value.size,
    barcode: localFilters.value.barcode || null,
    errorType: localFilters.value.errorType || null,
    // ... other filters
  };
  await errorStore.fetchProcessingErrors(filterParams);
};

// Pobierz dane, gdy komponent zostanie załadowany
onMounted(fetchErrors);

// --- Modal Handlers ---
const openErrorDetailsModal = (err) => {
  // errorStore.fetchErrorDetails(err.id); // Load details if modal needs them
  currentSelectedErrorId.value = err.id;
  showModal.value = true;
};
const handleCloseModal = () => {
  showModal.value = false;
  currentSelectedErrorId.value = null;
};
const handleOrderResubmitted = () => {
  handleCloseModal();
  fetchErrors(pagination.value.page); // Refresh current page
};

// --- Pagination Handlers ---
const goToPage = (pageNumber) => {
  if (pageNumber >= 0 && pageNumber < pagination.value.totalPages) {
    fetchErrors(pageNumber);
  }
};

// --- Formatting ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

const getStatusForBadge = (err) => {
  if (err.resolutionStatus === 'RESOLVED') return 'ACK_TRACKIT'; // Green
  if (err.resubmissionStatus === 'RESUBMITTED_ACCEPTED') return 'SENT_TO_TRACKIT'; // Blue
  if (err.errorType?.includes('ALIAS') || err.errorType?.includes('PROVIDER')) return 'PENDING_VERIFICATION'; // Yellow
  return 'FAILED'; // Red
};
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Processing Errors</h1>

    <div class="filter-controls mb-4 p-4 border rounded-lg bg-gray-50 flex gap-4">
      <input type="text" v-model="localFilters.barcode" placeholder="Barcode..." class="form-input" @keyup.enter="fetchErrors(0)" />
      <input type="text" v-model="localFilters.errorType" placeholder="Error Type..." class="form-input" @keyup.enter="fetchErrors(0)" />
      <button @click="fetchErrors(0)" class="button-primary">Search</button>
    </div>


    <div v-if="isLoading" class="text-center text-gray-500 py-10">
      <p>Loading errors...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
      <strong class="font-bold">Error: </strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="errors.length === 0" class="text-center text-gray-500 py-10">

      <p>No processing errors found. Great job! ✅</p>
    </div>

    <div v-else>
      <table class="min-w-full bg-white divide-y divide-gray-200">
        <thead class="bg-gray-50">
        <tr>

          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Type</th>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
        <tr v-for="item in errors" :key="item.id" class="border-b hover:bg-gray-50">
          <td class="py-3 px-4 font-mono text-sm">{{
              item.barcode || 'N/A' }}</td>
          <td class="py-3 px-4 text-sm">{{ item.errorType }}</td>
          <td class="py-3 px-4 text-sm max-w-xs truncate" :title="item.errorMessage">{{ item.errorMessage }}</td>
          <td class="py-3 px-4 text-sm">{{ formatDate(item.createdAt) }}</td>
          <td class="py-3 px-4 text-sm">
            <StatusBadge :status="getStatusForBadge(item)" />
          </td>
          <td class="py-3 px-4">
            <button @click="openErrorDetailsModal(item)" class="text-blue-600 hover:underline text-sm">Details</button>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="pagination-controls mt-4 flex justify-between items-center" v-if="pagination.totalPages > 1">
        <span class="text-sm text-gray-600">
          Page {{ pagination.page + 1 }} of {{ pagination.totalPages }} ({{ pagination.totalElements }} items)
        </span>
        <div class="flex gap-2">
          <button @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 0" class="button-secondary">Previous</button>
          <button @click="goToPage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages - 1" class="button-secondary">Next</button>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
/* Add utility classes to your global CSS or use Tailwind */
.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: auto;
  min-width: 150px;
}
.button-primary {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
}
.button-secondary {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-weight: 500;
}
.button-primary:disabled, .button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.max-w-xs { max-width: 20rem; }
</style>