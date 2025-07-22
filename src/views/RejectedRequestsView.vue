<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-xl shadow-2xl mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold">Odrzucone Żądania</h1>
      <p class="mt-2 text-slate-300">Przeglądaj, filtruj i zarządzaj odrzuconymi zleceniami.</p>
    </div>

    <div class="mb-6 p-6 bg-white rounded-xl shadow-lg">
      <h2 class="text-xl font-semibold mb-4 text-slate-700 border-b border-slate-200 pb-3">Filtry</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label for="filterBarcode" class="block text-xs font-medium text-slate-600 mb-1">Kod Kreskowy:</label>
          <input type="text" id="filterBarcode" v-model="localFilters.barcode" @input="applyFilterDebounced('barcode', $event.target.value)"
                 class="p-2.5 w-full border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-sm"
                 placeholder="Wpisz kod...">
        </div>
        <div>
          <label for="filterErrorType" class="block text-xs font-medium text-slate-600 mb-1">Typ Błędu:</label>
          <select id="filterErrorType" v-model="localFilters.errorType" @change="applyFilterDebounced('errorType', $event.target.value)"
                  class="p-2.5 w-full border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-sm bg-white">
            <option value="">Wszystkie</option>
            <option value="VALIDATION">Błąd Walidacji</option>
            <option value="PROCESSING">Błąd Przetwarzania</option>
            <option value="DESERIALIZATION_ERROR">Błąd Deserializacji</option>
            <option value="CONSTRAINT_VIOLATION">Naruszenie Ograniczeń</option>
            <option value="LISTENER_EXECUTION_FAILURE">Błąd Listenera</option>
            <option value="ADDRESS_ALIAS_MISMATCH_DB">Niezgodność Aliasu DB</option>
            <option value="ADDRESS_HERE_NEEDS_REVIEW">Adres HERE Wymaga Weryfikacji</option>
            <option value="ADDRESS_HERE_INVALID">Adres HERE Niepoprawny</option>
            <option value="ADDRESS_CUSTOMER_VERIFICATION_PENDING">Oczekuje na Potw. Klienta</option>
            <option value="EXTERNAL_SERVICE_FAILURE">Błąd Usługi Zewnętrznej</option>
            <option value="ADDRESS_DB_ERROR">Błąd DB Adresu</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="errorStore.isLoading && !errorStore.rejectedRequests.length" class="text-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
      <p class="text-lg text-slate-500 mt-5">Ładowanie danych...</p>
    </div>
    <div v-else-if="!errorStore.isLoading && errorStore.rejectedRequests.length === 0" class="text-center py-16 bg-white rounded-xl shadow-md">
      <svg class="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <h3 class="mt-3 text-lg font-medium text-slate-800">Brak odrzuconych żądań</h3>
      <p class="mt-1 text-sm text-slate-500">Nie znaleziono żądań pasujących do wybranych filtrów.</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-xl overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th @click="changeSort('eventId')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">ID Błędu <span v-html="sortIcon('eventId')"></span></th>
            <th @click="changeSort('requestID')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">Request ID <span v-html="sortIcon('requestID')"></span></th>
            <th @click="changeSort('barcode')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">Barcode <span v-html="sortIcon('barcode')"></span></th>
            <th @click="changeSort('errorType')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">Typ Błędu <span v-html="sortIcon('errorType')"></span></th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Weryf. Adr.</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Wiadomość</th>
            <th @click="changeSort('createdAt')" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100">Data <span v-html="sortIcon('createdAt')"></span></th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Akcje</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr v-for="error in errorStore.rejectedRequests" :key="error.id" class="hover:bg-slate-50/70 transition duration-150 ease-in-out">
            <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-600 font-mono">{{ error.eventId.substring(0,8) }}...</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{{ error.requestID || 'N/A' }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{{ error.barcode || 'N/A' }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span :class="getErrorTypeClassForTable(error.errorType)">{{ error.errorType || 'N/A' }}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{{ error.addressVerificationStatus || 'N/A' }}</td>
            <td class="px-4 py-3 text-sm text-slate-600 max-w-sm truncate" :title="error.errorMessage">
              {{ error.errorMessage ? error.errorMessage.substring(0, 70) + (error.errorMessage.length > 70 ? '...' : '') : 'Brak' }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ formatDateForTable(error.createdAt) }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <button @click="openErrorDetailsModal(error)" class="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline text-xs">Szczegóły</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="py-3 px-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="text-xs text-slate-600">
          Strona {{ errorStore.pagination.currentPage + 1 }} / {{ errorStore.pagination.totalPages }} ({{ errorStore.pagination.totalElements }} wyników)
        </div>
        <div class="flex space-x-1.5">
          <button 
            @click="goToPage(errorStore.pagination.currentPage - 1)" 
            :disabled="errorStore.pagination.currentPage === 0"
            class="px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
            Poprzednia
          </button>
          <button 
            @click="goToPage(errorStore.pagination.currentPage + 1)" 
            :disabled="errorStore.pagination.currentPage >= errorStore.pagination.totalPages - 1"
            class="px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
            Następna
          </button>
        </div>
      </div>
    </div>

    <ErrorDetailsModal 
        v-if="showModal"
        :error="currentSelectedError"
        :is-resubmitting="isResubmitting"
        :is-email-sending="isEmailSending"
        :resubmit-message="modalResubmitMessage"
        :resubmit-message-type="modalResubmitMessageType"
        :email-send-message="modalEmailSendMessage"
        :email-send-message-type="modalEmailSendMessageType"
        @close="handleCloseModal"
        @resubmit="handleModalResubmit"
        @send-verification-email="handleModalSendEmail"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useErrorStore } from '@/stores/errorStore';
import ErrorDetailsModal from '@/components/ErrorDetailsModal.vue';

const errorStore = useErrorStore();

const currentSelectedError = ref(null);
const showModal = ref(false);
const isResubmitting = ref(false);
const modalResubmitMessage = ref('');
const modalResubmitMessageType = ref('');
const isEmailSending = ref(false);
const modalEmailSendMessage = ref('');
const modalEmailSendMessageType = ref('');

const localFilters = ref({
  barcode: errorStore.filters.barcode,
  errorType: errorStore.filters.errorType,
});

let filterDebounceTimeout = null;
const applyFilterDebounced = (filterName, value) => {
  localFilters.value[filterName] = value;
  clearTimeout(filterDebounceTimeout);
  filterDebounceTimeout = setTimeout(() => {
    errorStore.setFilter(filterName, value);
  }, 500);
};

onMounted(() => {
  errorStore.fetchRejectedRequests();
});

const formatDateForTable = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const openErrorDetailsModal = async (error) => {
  currentSelectedError.value = { ...error };
  modalResubmitMessage.value = '';
  modalEmailSendMessage.value = '';
  showModal.value = true;
};

const handleCloseModal = () => {
  showModal.value = false;
  currentSelectedError.value = null;
};

const handleModalResubmit = async (payload) => {
  if (!currentSelectedError.value) return;
  isResubmitting.value = true;
  modalResubmitMessage.value = '';
  modalResubmitMessageType.value = '';
  try {
    const message = await errorStore.resubmitRequest({
      errorEventId: payload.eventId,
      correctedRawPayload: payload.correctedRawPayload
    });
    modalResubmitMessage.value = message || "Żądanie pomyślnie przesłane ponownie.";
    modalResubmitMessageType.value = 'success';
    setTimeout(() => {
      if (showModal.value) { // Zamknij modal tylko jeśli jest nadal otwarty
          handleCloseModal();
      }
      errorStore.fetchRejectedRequests(errorStore.pagination.currentPage);
    }, 2500);
  } catch (error) {
    modalResubmitMessage.value = error.message || "Nie udało się ponownie przesłać żądania.";
    modalResubmitMessageType.value = 'error';
  } finally {
    isResubmitting.value = false;
  }
};

const handleModalSendEmail = async (payload) => {
    if (!currentSelectedError.value) return;
    isEmailSending.value = true;
    modalEmailSendMessage.value = '';
    modalEmailSendMessageType.value = '';
    try {
        const message = await errorStore.sendVerificationEmailToCustomer(payload.eventId);
        modalEmailSendMessage.value = message || "Zlecenie wysłania emaila weryfikacyjnego zostało przyjęte.";
        modalEmailSendMessageType.value = 'success';
        
        // Odśwież dane błędu w modalu (jeśli nadal jest otwarty) LUB po prostu odśwież listę
        // errorStore.fetchRejectedRequests(errorStore.pagination.currentPage) już jest w sendVerificationEmailToCustomer
        // więc dane w tabeli się odświeżą. Jeśli modal ma być dalej otwarty, musimy zaktualizować currentSelectedError.
        if (currentSelectedError.value && currentSelectedError.value.eventId === payload.eventId) {
            // Możemy spróbować znaleźć zaktualizowany błąd na liście
            const updatedErrorFromList = errorStore.rejectedRequests.find(e => e.eventId === payload.eventId);
            if (updatedErrorFromList) {
                currentSelectedError.value = { ...updatedErrorFromList };
            } else {
                // Jeśli błąd zniknął z listy (np. został rozwiązany), zamknij modal
                // lub obsłuż to inaczej. Na razie zostawiamy otwarty z potencjalnie starymi danymi,
                // zakładając, że fetchRejectedRequests w store zaktualizuje tabelę.
            }
        }

    } catch (error) {
        modalEmailSendMessage.value = error.message || "Nie udało się wysłać emaila weryfikacyjnego.";
        modalEmailSendMessageType.value = 'error';
    } finally {
        isEmailSending.value = false;
    }
};

const goToPage = (pageNumber) => {
  if (pageNumber >= 0 && pageNumber < errorStore.pagination.totalPages) {
    errorStore.fetchRejectedRequests(pageNumber);
  }
};

const changeSort = (field) => {
  let direction = 'ASC';
  if (errorStore.sort.field === field && errorStore.sort.direction === 'ASC') {
    direction = 'DESC';
  }
  errorStore.setSort(field, direction);
};

const sortIcon = (field) => {
  if (errorStore.sort.field === field) {
    return errorStore.sort.direction === 'ASC' ? '&#9650;' : '&#9660;';
  }
  return ''; // Lub neutralna ikona '&#8693;'
};

const getErrorTypeClassForTable = (errorType) => {
    let base = 'px-2 py-0.5 rounded-full text-xs font-semibold inline-block leading-tight ';
    if (['ADDRESS_ALIAS_MISMATCH_DB', 'ADDRESS_HERE_NEEDS_REVIEW', 'ADDRESS_HERE_INVALID'].includes(errorType)) return base + 'bg-orange-100 text-orange-600 border border-orange-200';
    if (errorType === 'ADDRESS_CUSTOMER_VERIFICATION_PENDING') return base + 'bg-yellow-100 text-yellow-600 border border-yellow-200';
    if (['VALIDATION', 'CONSTRAINT_VIOLATION', 'DESERIALIZATION_ERROR'].includes(errorType)) return base + 'bg-red-100 text-red-600 border border-red-200';
    if (['PROCESSING', 'LISTENER_EXECUTION_FAILURE', 'EXTERNAL_SERVICE_FAILURE', 'ADDRESS_DB_ERROR'].includes(errorType)) return base + 'bg-purple-100 text-purple-600 border border-purple-200';
    return base + 'bg-slate-100 text-slate-600 border border-slate-200';
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
</style>