<template>
  <BaseModal :is-open="isOpen" @close="$emit('close')">
    <template #header>
      Szczegóły błędu: {{ error?.id }}
    </template>
    
    <template #body>
      <div class="address-verification-section mt-4 pt-4 border-t">
        <h4 class="text-lg font-semibold mb-3">Weryfikacja Adresu</h4>
        
        <div v-if="state.status === 'IDLE'">
          <p class="text-sm text-gray-600 mb-4">Adres w zleceniu może być niepoprawny. Rozpocznij weryfikację, aby pobrać sugestie.</p>
          <button @click="startVerification" :disabled="state.isLoading" class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            Rozpocznij weryfikację
          </button>
        </div>
        
        <div v-if="state.isLoading" class="text-center p-4">
          <p>Weryfikowanie adresu... To może potrwać chwilę.</p>
        </div>

        <div v-if="state.error" class="p-3 bg-red-100 text-red-700 rounded-md">
          <p><b>Błąd:</b> {{ state.error }}</p>
          <button @click="startVerification" class="mt-2 text-sm font-bold">Spróbuj ponownie</button>
        </div>

        <div v-if="state.status === 'COMPLETED'">
          <div v-if="state.suggestions.length > 0">
            <h5 class="font-semibold mb-2">Wybierz poprawny adres:</h5>
            <ul>
              <li v-for="(suggestion, index) in state.suggestions" :key="index" @click="selectedSuggestion = suggestion"
                  :class="{'bg-indigo-100': selectedSuggestion === suggestion}"
                  class="p-2 cursor-pointer hover:bg-gray-100 rounded">
                {{ suggestion.fullAddressLabel }}
              </li>
            </ul>
            <button @click="submitCorrection" :disabled="!selectedSuggestion || state.isSubmitting" class="w-full bg-green-600 text-white py-2 rounded-md mt-4 hover:bg-green-700 disabled:bg-green-300">
              Zatwierdź i zaktualizuj zlecenie
            </button>
          </div>
          <div v-else class="text-center p-4 bg-gray-50 rounded-md">
            <p>Nie znaleziono sugestii dla podanego adresu.</p>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, onUnmounted, watch } from 'vue';
import apiClient from '@/services/api';
import BaseModal from '@/components/Shared/BaseModal.vue'; // Przykładowy komponent modala

const props = defineProps({
  error: { type: Object, default: null },
  isOpen: { type: Boolean, required: true },
});
const emit = defineEmits(['close', 'correction-success']);

const state = reactive({
  status: 'IDLE', // IDLE, PENDING, COMPLETED, FAILED
  isLoading: false, isSubmitting: false, error: null, jobId: null, suggestions: [],
});
const selectedSuggestion = ref(null);
let pollingInterval = null;

const resetState = () => {
  stopPolling();
  Object.assign(state, { status: 'IDLE', isLoading: false, isSubmitting: false, error: null, jobId: null, suggestions: [] });
  selectedSuggestion.value = null;
};

// Resetuj stan za każdym razem, gdy modal jest otwierany z nowym błędem
watch(() => props.error, (newError) => {
  if (newError) resetState();
});

const startVerification = async () => {
  if (!props.error?.order?.id) return;
  resetState();
  state.isLoading = true;
  try {
    const response = await apiClient.post(`/api/address-verification/start/${props.error.order.id}`);
    state.jobId = response.data.verificationJobId;
    state.status = 'PENDING';
    startPolling();
  } catch (err) {
    state.error = 'Nie udało się rozpocząć procesu weryfikacji.';
    state.isLoading = false;
  }
};

const startPolling = () => {
  pollingInterval = setInterval(async () => {
    try {
      const response = await apiClient.get(`/api/address-verification/status/${state.jobId}`);
      const { status, suggestions } = response.data;
      if (status === 'COMPLETED' || status === 'FAILED') {
        stopPolling();
        state.isLoading = false;
        state.status = status;
        state.suggestions = status === 'COMPLETED' ? (suggestions || []) : [];
        if (status === 'FAILED') state.error = 'Weryfikacja adresu nie powiodła się.';
      }
    } catch (err) {
      stopPolling();
      state.isLoading = false;
      state.error = 'Błąd podczas sprawdzania statusu weryfikacji.';
    }
  }, 3000);
};

const stopPolling = () => clearInterval(pollingInterval);

const submitCorrection = async () => {
  if (!selectedSuggestion.value || !props.error?.order?.id) return;
  state.isSubmitting = true;
  try {
    await apiClient.put(`/api/orders/${props.error.order.id}/address`, selectedSuggestion.value);
    emit('correction-success');
    emit('close');
  } catch (err) {
    state.error = 'Nie udało się zaktualizować zlecenia.';
  } finally {
    state.isSubmitting = false;
  }
};

onUnmounted(stopPolling);
</script>