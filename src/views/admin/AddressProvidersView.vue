<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-xl shadow-2xl mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold">Zarządzanie Dostawcami Weryfikacji Adresów</h1>
      <p class="mt-2 text-slate-300">Konfiguruj aktywnego dostawcę używanego przez system TES.</p>
    </div>

    <div class="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <div v-if="isLoadingInitialData && !isPollingAnyOperation()" class="text-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
        <p class="text-slate-600">Ładowanie początkowej konfiguracji dostawców...</p>
      </div>

      <div v-else-if="loadError" class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300">
        <strong class="font-bold">Błąd ładowania konfiguracji:</strong> {{ loadError }}
        <button @click="fetchInitialProviderData" :disabled="isLoadingInitialData || isPollingAnyOperation()" class="ml-2 text-xs text-red-700 underline">Spróbuj ponownie</button>
      </div>

      <div v-else>
        <div class="mb-6 pb-4 border-b border-slate-200">
          <h2 class="text-xl font-semibold text-slate-700 mb-1">Aktualnie Aktywny Dostawca</h2>
          <div class="flex items-center">
            <div v-if="pollingStatus.currentProvider.isLoading && !currentProvider" class="text-slate-500 italic text-sm flex items-center">
              <span class="animate-spin h-4 w-4 mr-1 border-2 border-slate-400 border-t-transparent rounded-full"></span>
              Pobieranie... {{ pollingStatus.currentProvider.correlationId ? `(ID: ${pollingStatus.currentProvider.correlationId.substring(0,8)}...)` : '' }}
            </div>
            <p v-else-if="currentProvider" class="text-lg">
              <span class="font-bold px-3 py-1 rounded-full text-white" :class="getProviderBadgeClass(currentProvider)">
                {{ currentProvider.toUpperCase() }}
              </span>
              <span v-if="currentProvider.toLowerCase() === 'none'" class="ml-2 text-sm text-slate-500 italic">
                (Weryfikacja zewnętrzna jest wyłączona)
              </span>
            </p>
            <p v-else class="text-slate-500 italic">Nie można było ustalić aktywnego dostawcy.</p>

            <button @click="refreshCurrentProvider" :disabled="isLoadingInitialData || isPollingAnyOperation()" title="Odśwież aktualnego dostawcę" class="ml-4 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-50">
              <svg v-if="pollingStatus.currentProvider.isLoading" class="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>Odśwież</span>
            </button>
          </div>
           <p v-if="pollingStatus.currentProvider.error" class="text-xs text-red-500 mt-1">{{ pollingStatus.currentProvider.error }}</p>
        </div>

        <div class="mb-8">
          <label for="providerSelect" class="block text-sm font-medium text-slate-700 mb-1">Wybierz nowego dostawcę:</label>
          <div class="flex items-center space-x-3">
            <select
              id="providerSelect"
              v-model="selectedProviderToSet"
              class="block w-full max-w-xs p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white transition duration-150"
              :disabled="pollingStatus.setProvider.isLoading || isPollingAnyOperationExcept('setProvider')"
            >
              <option disabled value="">-- Wybierz --</option>
              <option
                v-for="provider in availableProviders"
                :key="provider"
                :value="provider.toLowerCase()"
              >
                {{ provider.toUpperCase() }}
              </option>
              <option value="none">NONE (Wyłącz weryfikację)</option>
            </select>
            <button
              @click="requestSetProvider"
              :disabled="pollingStatus.setProvider.isLoading || !selectedProviderToSet || selectedProviderToSet === currentProvider || isPollingAnyOperationExcept('setProvider')"
              class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="pollingStatus.setProvider.isLoading" class="animate-spin h-4 w-4 -ml-1 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
              {{ pollingStatus.setProvider.isLoading ? 'Przetwarzanie...' : 'Ustaw Aktywnego' }}
            </button>
          </div>
          <p v-if="selectedProviderToSet && selectedProviderToSet === currentProvider && !pollingStatus.setProvider.isLoading" class="text-xs text-slate-500 mt-1 italic">
            Wybrany dostawca jest już aktywny.
          </p>
        </div>

        <div v-if="operationMessage" :class="operationMessageType === 'success' ? 'bg-green-100 text-green-700 border-green-300' : (operationMessageType === 'info' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-red-100 text-red-700 border-red-300')" class="p-3 rounded-md border text-sm mb-4">
          {{ operationMessage }}
        </div>
         <div v-if="pollingStatus.setProvider.isLoading" class="text-sm text-slate-600 italic mb-4 flex items-center">
            <span class="animate-spin h-4 w-4 mr-2 border-2 border-slate-400 border-t-transparent rounded-full"></span>
            Oczekiwanie na wynik operacji (ID: {{ pollingStatus.setProvider.correlationId?.substring(0,8) || 'Zapisywanie' }})...
        </div>
        <p v-if="pollingStatus.setProvider.error" class="text-xs text-red-500 mt-1 mb-4">{{ pollingStatus.setProvider.error }}</p>

        <div class="mt-8 pt-6 border-t border-slate-200">
          <h3 class="text-lg font-semibold text-slate-700 mb-1">Dostępni Dostawcy w Systemie:</h3>
           <div class="flex items-center">
            <ul v-if="availableProviders.length && !pollingStatus.availableProviders.isLoading" class="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li v-for="provider in availableProviders" :key="provider">{{ provider }}</li>
                <li><b>NONE</b> - opcja wyłączenia zewnętrznej weryfikacji adresów.</li>
            </ul>
            <p v-else-if="pollingStatus.availableProviders.isLoading" class="text-slate-500 italic text-sm ml-2 flex items-center">
                <span class="animate-spin h-4 w-4 mr-1 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                Pobieranie listy... ({{ pollingStatus.availableProviders.correlationId?.substring(0,8) || 'ID' }}...)
            </p>
            <p v-else class="text-slate-500 italic">Brak informacji o dostępnych zaimplementowanych dostawcach.</p>
            <button @click="refreshAvailableProviders" :disabled="isLoadingInitialData || isPollingAnyOperation()" title="Odśwież listę dostępnych dostawców" class="ml-4 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-50">
               <svg v-if="pollingStatus.availableProviders.isLoading" class="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>Odśwież listę</span>
            </button>
           </div>
           <p v-if="pollingStatus.availableProviders.error" class="text-xs text-red-500 mt-1">{{ pollingStatus.availableProviders.error }}</p>

          <p class="text-xs text-slate-500 mt-4">
            <strong class="font-semibold">Uwaga:</strong> Zmiana aktywnego dostawcy jest zapisywana w konfiguracji centralnej (TES).
            System TES może wymagać odświeżenia konfiguracji, aby zmiana weszła w pełni w życie.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const isLoadingInitialData = ref(true);
const loadError = ref('');
const currentProvider = ref('');
const availableProviders = ref([]);
const selectedProviderToSet = ref('');

const operationMessage = ref('');
const operationMessageType = ref(''); // 'success', 'error', 'info'

const pollingStatus = ref({
    currentProvider: { correlationId: null, isLoading: false, error: null, intervalId: null, description: "Pobieranie aktualnego dostawcy" },
    availableProviders: { correlationId: null, isLoading: false, error: null, intervalId: null, description: "Pobieranie listy dostępnych dostawców" },
    setProvider: { correlationId: null, isLoading: false, error: null, intervalId: null, description: "Ustawianie aktywnego dostawcy" }
});

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

const clearPollingForOperation = (operationKey) => {
    if (pollingStatus.value[operationKey]?.intervalId) {
        clearInterval(pollingStatus.value[operationKey].intervalId);
    }
    pollingStatus.value[operationKey] = { 
        ...pollingStatus.value[operationKey],
        isLoading: false, 
        error: null, 
        intervalId: null 
    };
};

const clearAllPolling = () => {
    Object.keys(pollingStatus.value).forEach(key => clearPollingForOperation(key));
};

onUnmounted(() => {
    clearAllPolling();
});

const isPollingAnyOperation = () => {
    return Object.values(pollingStatus.value).some(op => op.isLoading);
};

const isPollingAnyOperationExcept = (exceptKey) => {
    return Object.entries(pollingStatus.value)
        .filter(([key]) => key !== exceptKey)
        .some(([,op]) => op.isLoading);
};


const pollOperation = async (correlationId, operationKey) => {
    const opDesc = pollingStatus.value[operationKey].description;
    
    if (!correlationId) {
        const errorMsg = `Brak CorrelationID dla operacji: ${opDesc}`;
        pollingStatus.value[operationKey].error = errorMsg;
        pollingStatus.value[operationKey].isLoading = false;
        if (operationKey === 'setProvider' || operationKey === 'currentProvider' || operationKey === 'availableProviders') { // Aktualizuj główny komunikat dla wszystkich operacji tego widoku
            operationMessage.value = errorMsg;
            operationMessageType.value = 'error';
        }
        return Promise.reject(new Error(errorMsg));
    }
    
    pollingStatus.value[operationKey].correlationId = correlationId;
    pollingStatus.value[operationKey].isLoading = true;
    pollingStatus.value[operationKey].error = null;
    
    // Komunikat o przetwarzaniu dla wszystkich operacji
    operationMessage.value = `Przetwarzanie: ${opDesc} (ID: ${correlationId.substring(0,8)}...).`;
    operationMessageType.value = 'info';


    return new Promise((resolve, reject) => {
        let polls = 0;
        if (pollingStatus.value[operationKey].intervalId) {
            clearInterval(pollingStatus.value[operationKey].intervalId);
        }

        pollingStatus.value[operationKey].intervalId = setInterval(async () => {
            polls++;
            if (!pollingStatus.value[operationKey].isLoading || polls > MAX_POLLS) {
                if (polls > MAX_POLLS && pollingStatus.value[operationKey].isLoading) {
                    pollingStatus.value[operationKey].error = `Timeout oczekiwania na zakończenie operacji '${opDesc}' (CorrID: ${correlationId}).`;
                }
                const finalErrorMsg = pollingStatus.value[operationKey].error || `Polling for ${opDesc} (CorrID: ${correlationId}) stopped or timed out.`;
                operationMessage.value = finalErrorMsg;
                operationMessageType.value = 'error';
                
                clearPollingForOperation(operationKey);
                return reject(new Error(finalErrorMsg));
            }

            console.debug(`Odpytywanie operacji ${operationKey} (CorrID: ${correlationId}), próba ${polls}`);
            try {
                const res = await apiClient.get(`/api/admin/address-verification/operations/${correlationId}`);
                
                if (res.data && res.data.status === 'COMPLETED') {
                    clearPollingForOperation(operationKey);
                    console.info(`Operacja '${opDesc}' (CorrID: ${correlationId}) zakończona sukcesem.`);
                     if (operationKey === 'setProvider') {
                         operationMessage.value = (res.data.result && typeof res.data.result === 'string') ? res.data.result : `Operacja '${opDesc}' zakończona pomyślnie.`;
                         operationMessageType.value = 'success';
                     } else if (operationMessage.value.startsWith('Przetwarzanie')) { // Tylko jeśli nie ma innego błędu
                        operationMessage.value = `Operacja '${opDesc}' zakończona.`;
                        operationMessageType.value = 'success';
                     }
                    resolve(res.data.result);
                } else if (res.data && res.data.status === 'FAILED') {
                    clearPollingForOperation(operationKey);
                    const errorMsg = res.data.errorDetails || `Operacja ${opDesc} nie powiodła się.`;
                    pollingStatus.value[operationKey].error = errorMsg;
                    operationMessage.value = errorMsg;
                    operationMessageType.value = 'error';
                    console.error(`Operacja '${opDesc}' (CorrID: ${correlationId}) zakończona błędem: ${errorMsg}`);
                    reject(new Error(errorMsg));
                } else if (res.data && (res.data.status === 'PENDING' || res.data.status === 'PROCESSING')) {
                    // Kontynuuj odpytywanie
                    // Można zaktualizować `operationMessage` o statusie PENDING/PROCESSING
                    operationMessage.value = `Operacja '${opDesc}' w toku (Status: ${res.data.status}, ID: ${correlationId.substring(0,8)})...`;
                    operationMessageType.value = 'info';
                } else { 
                    clearPollingForOperation(operationKey);
                    const unexpectedMsg = `Nieoczekiwany status operacji '${res.data?.status || 'BRAK'}' dla '${opDesc}' (CorrID: ${correlationId}).`;
                    pollingStatus.value[operationKey].error = unexpectedMsg;
                    operationMessage.value = unexpectedMsg;
                    operationMessageType.value = 'error';
                    console.error(unexpectedMsg);
                    reject(new Error(unexpectedMsg));
                }
            } catch (pollError) {
                clearPollingForOperation(operationKey);
                const networkErrorMsg = `Błąd sieci podczas odpytywania o status operacji '${opDesc}' (CorrID: ${correlationId}).`;
                pollingStatus.value[operationKey].error = pollError.response?.data?.error || pollError.message || networkErrorMsg;
                operationMessage.value = pollingStatus.value[operationKey].error;
                operationMessageType.value = 'error';
                console.error(networkErrorMsg, pollError);
                reject(new Error(pollingStatus.value[operationKey].error));
            }
        }, POLL_INTERVAL_MS);
    });
};

const initiateOperation = async (endpoint, operationKey, payload = null, httpMethod = 'POST') => {
    if (!authStore.isLoggedIn) {
        loadError.value = "Użytkownik nie jest zalogowany."; // Ustaw loadError zamiast rzucać, aby obsłużyć w UI
        isLoadingInitialData.value = false; // Jeśli to było ładowanie początkowe
        return Promise.reject(new Error("Użytkownik nie jest zalogowany."));
    }
    const opDesc = pollingStatus.value[operationKey].description;
    clearPollingForOperation(operationKey); // Wyczyść poprzedni stan dla tej operacji

    pollingStatus.value[operationKey].isLoading = true;
    pollingStatus.value[operationKey].error = null;
    
    if (operationKey === 'setProvider' || isLoadingInitialData.value) {
         operationMessage.value = `Inicjowanie: ${opDesc}...`;
         operationMessageType.value = 'info';
    }

    try {
        let response;
        const config = (payload && (payload instanceof String || typeof payload === 'string')) ? { headers: { 'Content-Type': 'text/plain' } } : {};

        if (httpMethod.toUpperCase() === 'POST') {
            response = await apiClient.post(endpoint, payload, config);
        } else { // Dla GET, payload jest ignorowany
            response = await apiClient.get(endpoint, config);
        }
        
        const correlationId = response.data.correlationId;
        if (!correlationId) {
            throw new Error(`Nie udało się zainicjować operacji: ${opDesc}. Brak CorrelationID w odpowiedzi serwera: ${JSON.stringify(response.data)}`);
        }
        console.debug(`Zainicjowano ${opDesc}, CorrID: ${correlationId}`);
        pollingStatus.value[operationKey].correlationId = correlationId;
        return pollOperation(correlationId, operationKey);
    } catch (initError) {
        pollingStatus.value[operationKey].isLoading = false;
        const errorDetail = initError.response?.data?.error || initError.response?.data?.message || initError.message || `Nie udało się zainicjować operacji: ${opDesc}.`;
        pollingStatus.value[operationKey].error = errorDetail;
        if (operationKey === 'setProvider' || isLoadingInitialData.value) {
            operationMessage.value = errorDetail;
            operationMessageType.value = 'error';
        }
        console.error(`Błąd inicjacji operacji '${opDesc}':`, initError);
        throw new Error(pollingStatus.value[operationKey].error);
    }
};

const fetchInitialProviderData = async () => {
    isLoadingInitialData.value = true;
    loadError.value = '';
    operationMessage.value = '';
    // clearAllPolling(); // Nie czyść tutaj, bo `initiateOperation` to zrobi dla swoich kluczy

    try {
        // Użyj POST dla endpointów inicjujących
        const results = await Promise.allSettled([
            initiateOperation('/api/admin/address-verification/providers/current/initiate', 'currentProvider', null, 'POST'),
            initiateOperation('/api/admin/address-verification/providers/available/initiate', 'availableProviders', null, 'POST')
        ]);

        let hasFulfilledCurrent = false;
        let hasFulfilledAvailable = false;

        if (results[0].status === 'fulfilled') {
            currentProvider.value = results[0].value || 'none';
            selectedProviderToSet.value = currentProvider.value && currentProvider.value !== 'none' ?
                                       currentProvider.value.toLowerCase() : 'none';
            hasFulfilledCurrent = true;
        } else {
            currentProvider.value = 'N/A (błąd)';
            // pollingStatus.currentProvider.error jest już ustawione przez pollOperation
            loadError.value += `Błąd pobierania aktualnego dostawcy: ${pollingStatus.value.currentProvider.error || results[0].reason?.message || 'Nieznany błąd'}. `;
        }

        if (results[1].status === 'fulfilled') {
            availableProviders.value = Array.isArray(results[1].value) ? results[1].value : [];
            hasFulfilledAvailable = true;
        } else {
            availableProviders.value = [];
            loadError.value += `Błąd pobierania listy dostępnych dostawców: ${pollingStatus.value.availableProviders.error || results[1].reason?.message || 'Nieznany błąd'}.`;
        }

        if (hasFulfilledCurrent && hasFulfilledAvailable) {
            operationMessage.value = "Konfiguracja dostawców załadowana pomyślnie.";
            operationMessageType.value = 'success';
        } else if (loadError.value && !isPollingAnyOperation()) { // Pokaż ogólny błąd tylko jeśli nic nie polluje
             operationMessage.value = "Wystąpiły problemy podczas ładowania konfiguracji. Sprawdź błędy poszczególnych operacji.";
             operationMessageType.value = 'error';
        } else if (isPollingAnyOperation()){
            operationMessage.value = "Trwa ładowanie danych..."; // Ogólny komunikat, jeśli coś jeszcze polluje
            operationMessageType.value = 'info';
        }

    } catch (error) { // Ten catch złapie błędy, które nie są PromiseRejectionEvent
        console.error('Krytyczny błąd podczas inicjowania pobierania konfiguracji:', error);
        loadError.value = error.message || 'Nie udało się załadować początkowej konfiguracji.';
        operationMessage.value = loadError.value;
        operationMessageType.value = 'error';
    } finally {
        isLoadingInitialData.value = false;
    }
};

const requestSetProvider = async () => {
  if (!selectedProviderToSet.value || pollingStatus.value.setProvider.isLoading || isPollingAnyOperationExcept('setProvider')) return;
  
  operationMessage.value = ''; 
  operationMessageType.value = '';

  try {
    // Endpoint `/api/admin/address-verification/providers/current` jest POST i przyjmuje String w ciele
    const result = await initiateOperation(
        '/api/admin/address-verification/providers/current', 
        'setProvider',
        selectedProviderToSet.value, // Payload to string
        'POST' 
    );
    // Komunikat sukcesu jest już ustawiany w pollOperation
    await fetchInitialProviderData(); // Odśwież całą konfigurację po sukcesie

  } catch (error) {
    console.error('Błąd podczas ustawiania aktywnego dostawcy:', error);
    // Komunikat błędu jest już ustawiony w pollOperation lub initiateOperation
    if (!operationMessage.value || operationMessageType.value !== 'error') {
        operationMessage.value = error.message || 'Nie udało się ustawić aktywnego dostawcy.';
        operationMessageType.value = 'error';
    }
  }
};

const refreshCurrentProvider = async () => {
    if (isPollingAnyOperation()) return;
    operationMessage.value = '';
    try {
        const result = await initiateOperation('/api/admin/address-verification/providers/current/initiate', 'currentProvider', null, 'POST');
        currentProvider.value = result || 'none';
        selectedProviderToSet.value = currentProvider.value && currentProvider.value !== 'none' ? currentProvider.value.toLowerCase() : 'none';
        operationMessage.value = "Pomyślnie odświeżono aktualnego dostawcę.";
        operationMessageType.value = 'success';
    } catch (error) {
        operationMessage.value = error.message || "Nie udało się odświeżyć aktualnego dostawcy.";
        operationMessageType.value = 'error';
        // Błąd specyficzny dla operacji jest już w pollingStatus.currentProvider.error
    }
};

const refreshAvailableProviders = async () => {
    if (isPollingAnyOperation()) return;
    operationMessage.value = '';
    try {
        const result = await initiateOperation('/api/admin/address-verification/providers/available/initiate', 'availableProviders', null, 'POST');
        availableProviders.value = Array.isArray(result) ? result : [];
        operationMessage.value = "Pomyślnie odświeżono listę dostępnych dostawców.";
        operationMessageType.value = 'success';
    } catch (error) {
        operationMessage.value = error.message || "Nie udało się odświeżyć listy dostępnych dostawców.";
        operationMessageType.value = 'error';
        // Błąd specyficzny dla operacji jest już w pollingStatus.availableProviders.error
    }
};

const getProviderBadgeClass = (providerName) => {
  if (!providerName) return 'bg-slate-400';
  switch (providerName.toLowerCase()) {
    case 'here': return 'bg-blue-600';
    case 'nominatim': return 'bg-green-600';
    case 'maps': return 'bg-yellow-500 text-black';
    case 'none': return 'bg-slate-500';
    default: return 'bg-gray-500';
  }
};

onMounted(() => {
  fetchInitialProviderData();
});

</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>