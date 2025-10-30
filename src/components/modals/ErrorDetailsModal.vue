<template>
  <div class="error-details-modal">
    <div class="address-verification-section">
      <h4>Weryfikacja Adresu</h4>

      <div v-if="verificationState.status === 'IDLE'">
        <p>Adres w tym zleceniu wygląda na niepoprawny. Rozpocznij weryfikację, aby uzyskać sugestie.</p>
        <button @click="handleStartVerification" :disabled="verificationState.isLoading">
          Rozpocznij weryfikację
        </button>
      </div>
      
      <div v-if="verificationState.isLoading">
        <p>Weryfikowanie adresu... <span class="spinner"></span></p>
        <p>To może potrwać chwilę.</p>
      </div>

      <div v-if="verificationState.error" class="error-message">
        <p>Wystąpił błąd podczas weryfikacji: {{ verificationState.error }}</p>
        <button @click="handleStartVerification">Spróbuj ponownie</button>
      </div>

      <div v-if="verificationState.status === 'COMPLETED' && verificationState.suggestions.length > 0">
        <h5>Wybierz poprawny adres:</h5>
        <ul>
          <li 
            v-for="(suggestion, index) in verificationState.suggestions" 
            :key="index"
            @click="selectSuggestion(suggestion)"
            :class="{ selected: selectedSuggestion === suggestion }">
            {{ suggestion.fullAddressLabel }}
          </li>
        </ul>
        <button @click="submitCorrection" :disabled="!selectedSuggestion">
          Zatwierdź i zaktualizuj zlecenie
        </button>
      </div>
      
      <div v-if="verificationState.status === 'COMPLETED' && verificationState.suggestions.length === 0">
        <p>Nie znaleziono sugestii dla podanego adresu.</p>
      </div>
    </div>

    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import api from '@/services/Api.js'; // Import naszego klienta API

// Props, np. ID zlecenia
const props = defineProps({
  orderId: {
    type: String,
    required: true,
  },
});

// Reaktywny stan do zarządzania procesem weryfikacji
const verificationState = reactive({
  status: 'IDLE', // IDLE, PENDING, COMPLETED, FAILED
  isLoading: false,
  error: null,
  jobId: null,
  suggestions: [],
});

const selectedSuggestion = ref(null);
let pollingInterval = null;

// --- GŁÓWNA LOGIKA ---

const handleStartVerification = async () => {
  resetState();
  verificationState.isLoading = true;
  
  try {
    const response = await api.startAddressVerification(props.orderId);
    verificationState.jobId = response.data.verificationJobId;
    verificationState.status = 'PENDING';
    startPolling();
  } catch (err) {
    verificationState.error = 'Nie udało się rozpocząć procesu weryfikacji.';
    verificationState.isLoading = false;
  }
};

const startPolling = () => {
  // Ustawiamy interwał - odpytujemy co 2 sekundy
  pollingInterval = setInterval(async () => {
    try {
      const response = await api.getVerificationStatus(verificationState.jobId);
      const { status, suggestions } = response.data;

      // Jeśli zadanie jest zakończone, przerywamy polling i aktualizujemy stan
      if (status === 'COMPLETED' || status === 'FAILED') {
        stopPolling();
        verificationState.isLoading = false;
        verificationState.status = status;
        
        if (status === 'COMPLETED') {
          verificationState.suggestions = suggestions || [];
        } else {
          verificationState.error = 'Weryfikacja adresu nie powiodła się po stronie serwera.';
        }
      }
      // Jeśli status to wciąż PENDING, nic nie robimy, czekamy na kolejny cykl
    } catch (err) {
      stopPolling();
      verificationState.isLoading = false;
      verificationState.error = 'Błąd podczas sprawdzania statusu weryfikacji.';
    }
  }, 2000); // 2000 ms = 2 sekundy

  // Zabezpieczenie: przerywamy polling po 30 sekundach, aby uniknąć nieskończonej pętli
  setTimeout(() => {
    if (pollingInterval) {
        stopPolling();
        verificationState.isLoading = false;
        verificationState.error = 'Przekroczono limit czasu oczekiwania na odpowiedź.';
    }
  }, 30000); // 30s timeout
};

const stopPolling = () => {
  clearInterval(pollingInterval);
  pollingInterval = null;
};

const selectSuggestion = (suggestion) => {
  selectedSuggestion.value = suggestion;
};

const submitCorrection = async () => {
  if (!selectedSuggestion.value) return;
  verificationState.isLoading = true;
  
  try {
    await api.submitAddressCorrection(props.orderId, selectedSuggestion.value);
    // Tutaj można wyemitować zdarzenie do rodzica, aby zamknąć modal i odświeżyć listę
    // emit('address-corrected');
    alert('Adres został pomyślnie zaktualizowany!');
    resetState();
  } catch (err) {
    verificationState.error = 'Nie udało się zaktualizować zlecenia.';
  } finally {
    verificationState.isLoading = false;
  }
};

const resetState = () => {
    stopPolling();
    verificationState.status = 'IDLE';
    verificationState.isLoading = false;
    verificationState.error = null;
    verificationState.jobId = null;
    verificationState.suggestions = [];
    selectedSuggestion.value = null;
};

</script>

<style scoped>
/* Dodaj style dla feedbacku wizualnego */
.spinner {
  /* Prosty spinner CSS */
  display: inline-block;
  border: 4px solid rgba(0,0,0,.1);
  border-left-color: #7983ff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-message { color: red; }
ul li { cursor: pointer; padding: 5px; margin: 2px 0; }
ul li.selected { background-color: #e0e0ff; }
</style>