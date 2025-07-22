<template>
  <div
    v-if="error"
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-opacity duration-300 ease-out px-4"
    @click.self="handleClose"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="'modal-title-' + error.eventId"
  >
    <div class="relative w-full max-w-6xl mx-auto my-6 transform transition-all duration-300 ease-out">
      <div class="border-0 rounded-xl shadow-2xl relative flex flex-col w-full bg-white outline-none focus:outline-none max-h-[90vh]">
        <div class="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t-xl bg-slate-50">
          <h3 :id="'modal-title-' + error.eventId" class="text-xl lg:text-2xl font-semibold text-slate-700">
            Szczegóły Błędu: <span class="text-indigo-600">{{ error.eventId ? error.eventId.substring(0,12) : 'N/A' }}...</span>
          </h3>
          <button
            class="p-1 ml-auto bg-transparent border-0 text-slate-600 hover:text-slate-900 opacity-70 hover:opacity-100 text-2xl leading-none font-semibold outline-none focus:outline-none transition-colors"
            @click="handleClose"
            aria-label="Zamknij modal"
          >
            <span class="bg-transparent h-6 w-6 block outline-none focus:outline-none">×</span>
          </button>
        </div>

        <div class="relative p-6 flex-auto overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-6 text-sm">
            <div><strong class="text-slate-500 block">Request ID:</strong> <span class="text-slate-700 break-all">{{ error.requestID || 'N/A' }}</span></div>
            <div><strong class="text-slate-500 block">Barcode:</strong> <span class="text-slate-700">{{ error.barcode || 'N/A' }}</span></div>
            <div><strong class="text-slate-500 block">Source Topic:</strong> <span class="text-slate-700">{{ error.sourceTopic || 'N/A' }}</span></div>
            <div>
              <strong class="text-slate-500 block">Error Type:</strong>
              <span :class="getErrorTypeClass(error.errorType)" class="px-2.5 py-1 rounded-full text-xs font-bold inline-block leading-tight">{{ error.errorType || 'N/A' }}</span>
            </div>
            <div><strong class="text-slate-500 block">Address Verification Status:</strong> <span class="text-slate-700">{{ error.addressVerificationStatus || 'N/A' }}</span></div>
            <div><strong class="text-slate-500 block">Data Utworzenia Rekordu:</strong> <span class="text-slate-700">{{ formatDate(error.createdAt) }}</span></div>
            <div v-if="error.kafkaMessageTimestamp" class="md:col-span-1 lg:col-span-1">
                <strong class="text-slate-500 block">Czas Odebrania Wiadomości:</strong>
                <span class="text-slate-700">{{ formatDate(error.kafkaMessageTimestamp) }}</span>
            </div>
            <div><strong class="text-slate-500 block">Status Ponowienia:</strong> <span class="text-slate-700">{{ error.resubmissionStatus || 'N/A' }}</span></div>
          </div>

          <div v-if="error.errorMessage" class="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
            <strong class="text-red-700 block mb-1.5 text-xs uppercase font-bold">Komunikat Błędu:</strong>
            <pre class="text-sm whitespace-pre-wrap text-red-600 p-2 rounded bg-red-100/50">{{ error.errorMessage }}</pre>
          </div>

          <div v-if="error.stacktrace" class="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <strong class="text-slate-700 block mb-1.5 text-xs uppercase font-bold">Stacktrace:</strong>
            <pre class="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto p-2 rounded bg-slate-100/80 font-mono">{{ error.stacktrace }}</pre>
          </div>
          <div v-if="isAddressErrorType(error.errorType)" class="mb-5 p-4 border-2 border-orange-300 rounded-lg bg-orange-50 shadow-sm">
            <h4 class="text-lg font-semibold text-orange-700 mb-4">Weryfikacja Adresu</h4>

            <div class="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-md">
              <p class="text-sm font-medium text-orange-700">
                Problem dotyczy adresu:
                <span class="font-bold">{{ determineAddressContextTitle(error, 'order_relevant') }}</span>.
              </p>
              <div v-if="error.providerRawQuery" class="mt-2">
                <p class="text-xs text-slate-600 mb-1">
                    Zapytanie wysłane do dostawcy
                    <span v-if="providerNameFromSuggestionsOrQuery">
                        ({{ providerNameFromSuggestionsOrQuery }}):
                    </span>
                </p>
                <pre class="text-xs whitespace-pre-wrap p-2 rounded bg-slate-100 font-mono">{{ error.providerRawQuery }}</pre>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div class="lg:col-span-5 space-y-4">
                <AddressDisplay
                    :title="determineAddressContextTitle(error, 'order_relevant') + ' (Oryginalny ze zlecenia)'"
                    :address-string="error.originalAddressJson || error.rawPayload"
                    :address-context="determineAddressContextFromError(error, 'order_relevant')"
                    :compare-to-address-string="error.errorType === 'ADDRESS_ALIAS_MISMATCH_DB' ? error.dbAddressJson : null"
                    :highlight-as-source="error.errorType === 'ADDRESS_ALIAS_MISMATCH_DB' ? 'neutral' : 'error'"
                />
                <AddressDisplay
                    v-if="error.errorType === 'ADDRESS_ALIAS_MISMATCH_DB'"
                    title="Adres w Bazie Danych (oczekiwany dla aliasu)"
                    :address-string="error.dbAddressJson"
                    address-context="database_dto"
                    highlight-as-source="truth"
                />
                
                <div v-if="editableOrderData && activeAddressEditorContext" class="mt-4 p-4 border rounded-md bg-white shadow">
                  <h5 class="text-sm font-semibold mb-3 text-slate-700">
                    Uzupełnij / Popraw Dane Adresu {{ activeAddressEditorContext === 'pickup' ? 'Nadania' : 'Dostawy' }}:
                  </h5>
                  <div class="space-y-3">
                    <div v-for="field in (activeAddressEditorContext === 'pickup' ? addressFieldsDefinition.pickup : addressFieldsDefinition.delivery)" :key="field.modelKey">
                      <label :for="field.id" class="block text-xs font-medium text-slate-600 mb-0.5">{{ field.label }}:</label>
                      <input 
                        type="text" 
                        :id="field.id"
                        v-model="editableOrderData[field.modelKey]" 
                        class="text-xs p-2 border rounded-md w-full shadow-sm transition-colors"
                        :class="validationErrors[field.modelKey] ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'"
                        :placeholder="field.label"
                      />
                      <p v-if="validationErrors[field.modelKey]" class="text-xs text-red-600 mt-1">{{ validationErrors[field.modelKey] }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-7">
                <div v-if="showSuggestions" class="mb-6">
                  <p class="text-orange-700 font-medium mb-2 text-sm">
                    Początkowe sugestie od dostawcy ({{ providerNameFromSuggestionsOrQuery }}):
                  </p>
                  <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <div
                      v-for="(suggestion, index) in error.suggestedAddresses"
                      :key="'initial-suggestion-' + error.eventId + '-' + index"
                      @click="selectSuggestion(suggestion, index, 'initial')"
                      class="p-1 rounded-lg hover:ring-2 hover:ring-indigo-500 focus:ring-indigo-500 focus:outline-none transition-all duration-150 ease-in-out cursor-pointer"
                      :class="selectedSuggestionIndex === index && lastSelectedSuggestionSource === 'initial' ? 'ring-2 ring-indigo-600 bg-indigo-50' : 'ring-1 ring-slate-300 hover:ring-slate-400'"
                      tabindex="0" @keypress.enter.space="selectSuggestion(suggestion, index, 'initial')">
                      <AddressDisplay
                        :title="'Sugestia ' + (suggestion.providerSource || 'Dostawcy') + ' ' + (index + 1)"
                        :address-string="JSON.stringify(suggestion)"
                        address-context="provider_suggestion"
                        :highlight-as-source="selectedSuggestionIndex === index && lastSelectedSuggestionSource === 'initial' ? 'truth' : 'neutral'"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="activeAddressEditorContext && (isLoadingDynamicSuggestions || dynamicSuggestionsPolling.isLoading || dynamicSuggestions.length > 0 || dynamicSuggestionsPolling.error || dynamicSuggestionsError)">
                  <h5 class="text-sm font-semibold text-slate-700 mb-2 mt-4 border-t pt-3">
                    Dynamiczne Sugestie (na podstawie wprowadzanych danych):
                  </h5>
                  <div v-if="isLoadingDynamicSuggestions && !dynamicSuggestionsPolling.isLoading" class="text-xs text-slate-500 italic">Inicjowanie...</div>
                  <div v-if="dynamicSuggestionsPolling.isLoading" class="text-xs text-slate-500 italic flex items-center">
                     <span class="animate-spin h-3 w-3 mr-1 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                    Ładowanie sugestii (ID: {{ dynamicSuggestionsPolling.correlationId?.substring(0,8) }})...
                  </div>
                  <div v-if="dynamicSuggestionsPolling.error || dynamicSuggestionsError" class="text-xs text-red-500 p-2 bg-red-50 rounded-md">
                    {{ dynamicSuggestionsPolling.error || dynamicSuggestionsError }}
                  </div>
                  
                  <div v-if="!isLoadingDynamicSuggestions && !dynamicSuggestionsPolling.isLoading && dynamicSuggestions.length > 0" class="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <div
                      v-for="(suggestion, index) in dynamicSuggestions"
                      :key="'dyn-suggestion-' + index"
                      @click="selectSuggestion(suggestion, index, 'dynamic')"
                      class="p-1 rounded-lg hover:ring-2 hover:ring-teal-500 focus:ring-teal-500 focus:outline-none transition-all duration-150 ease-in-out cursor-pointer"
                      :class="selectedSuggestionIndex === index && lastSelectedSuggestionSource === 'dynamic' ? 'ring-2 ring-teal-600 bg-teal-50' : 'ring-1 ring-slate-300 hover:ring-slate-400'"
                      tabindex="0" @keypress.enter.space="selectSuggestion(suggestion, index, 'dynamic')">
                      <AddressDisplay
                        :title="'Dynamiczna Sugestia ' + (suggestion.providerSource || 'Dostawcy') + ' ' + (index + 1)"
                        :address-string="JSON.stringify(suggestion)"
                        address-context="provider_suggestion"
                        :highlight-as-source="selectedSuggestionIndex === index && lastSelectedSuggestionSource === 'dynamic' ? 'truth' : 'neutral'"
                      />
                    </div>
                  </div>
                   <div v-if="!isLoadingDynamicSuggestions && !dynamicSuggestionsPolling.isLoading && dynamicSuggestions.length === 0 && !dynamicSuggestionsPolling.error && !dynamicSuggestionsError && (editableOrderData && activeAddressEditorContext && (editableOrderData[activeAddressEditorContext === 'pickup' ? 'PickUpStreet' : 'DeliveryStreet'] || editableOrderData[activeAddressEditorContext === 'pickup' ? 'PickUpCity' : 'DeliveryCity']))" class="text-xs text-slate-500 italic mt-1">
                      Brak dynamicznych sugestii dla wprowadzonych danych.
                  </div>
                </div>
                <div v-if="showInvalidAddressMessage && !showSuggestions">
                    <p class="text-red-600 font-medium text-sm">
                        Adres nie został poprawnie zweryfikowany
                        <span v-if="providerNameFromSuggestionsOrQuery"> przez {{ providerNameFromSuggestionsOrQuery }}</span>
                        <span v-else> przez dostawcę</span>
                        i nie ma dostępnych sugestii lub wystąpił błąd usługi. Proszę ręcznie poprawić dane.
                    </p>
                     <p v-if="error.errorMessage && error.errorMessage.includes('java.lang.IllegalArgumentException')" class="text-xs text-red-500 mt-1">
                        Wskazówka: Błąd 'IllegalArgumentException' często oznacza problem z formatem danych wysyłanych do dostawcy (np. nieoczekiwane znaki).
                    </p>
                </div>
                <div v-if="error.errorType === 'ADDRESS_CUSTOMER_VERIFICATION_PENDING'" class="p-3 bg-yellow-100 text-yellow-700 rounded-md text-sm">
                    <p class="font-medium">Wysłano email do klienta z prośbą o weryfikację adresu. Oczekiwanie na odpowiedź.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label for="rawPayloadModal" class="block text-xs font-semibold text-slate-600 mb-1 uppercase">Raw Payload (JSON do edycji - oryginalne zlecenie):</label>
            <textarea
              id="rawPayloadModal"
              v-model="editablePayload"
              rows="10"
              class="mt-1 p-3 w-full border rounded-md shadow-sm sm:text-sm font-mono text-xs leading-relaxed focus:shadow-lg"
              :class="payloadJsonError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'"
              placeholder="Edytuj JSON payload..."></textarea>
            <p v-if="payloadJsonError" class="text-xs text-red-600 mt-1">{{ payloadJsonError }}</p>
             <div v-if="validationErrors.general && !payloadJsonError" class="text-xs text-red-600 mt-1">
               {{ validationErrors.general }}
             </div>
          </div>
        </div>

        <div class="flex items-center justify-end p-5 border-t border-solid border-slate-200 rounded-b-xl bg-slate-50 space-x-3">
          <button
            @click="triggerSendVerificationEmail"
            v-if="canTriggerSendVerificationEmail(error.errorType)"
            :disabled="props.isEmailSending || !isPayloadValid"
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
          >
            <span v-if="props.isEmailSending" class="animate-spin h-4 w-4 -ml-1 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
            Wyślij Email do Klienta
          </button>
          <button
            @click="triggerResubmit"
            :disabled="props.isResubmitting || !isPayloadValid"
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
          >
            <span v-if="props.isResubmitting" class="animate-spin h-4 w-4 -ml-1 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
            Zapisz i Prześlij Ponownie
          </button>
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors duration-150 ease-in-out"
          >
            Anuluj
          </button>
        </div>
        <div v-if="localResubmitMessage || localEmailSendMessage" class="px-5 pb-3 bg-slate-50 rounded-b-xl text-center">
            <p v-if="localResubmitMessage" :class="localResubmitMessageType === 'success' ? 'text-green-600' : 'text-red-600'" class="text-xs">{{ localResubmitMessage }}</p>
            <p v-if="localEmailSendMessage" :class="localEmailSendMessageType === 'success' ? 'text-green-600' : 'text-red-600'" class="text-xs mt-1">{{ localEmailSendMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import AddressDisplay from './AddressDisplay.vue';
import apiClient from '@/services/api.js';
import { debounce } from 'lodash-es';

const props = defineProps({
  error: { type: Object, required: true },
  isResubmitting: { type: Boolean, default: false },
  isEmailSending: { type: Boolean, default: false },
  resubmitMessage: String,
  resubmitMessageType: String,
  emailSendMessage: String,
  emailSendMessageType: String
});

const emit = defineEmits(['close', 'resubmit', 'send-verification-email']);

const editablePayload = ref('');
const originalPayloadForComparison = ref('');
const editableOrderData = ref(null);
const payloadJsonError = ref('');
const validationErrors = ref({});
const localResubmitMessage = ref('');
const localResubmitMessageType = ref('');
const localEmailSendMessage = ref('');
const localEmailSendMessageType = ref('');
const selectedSuggestionIndex = ref(null);
const lastSelectedSuggestionSource = ref(null);
const showAddressEditorAfterSuggestion = ref(false);

// --- ZMIENNE REAKTYWNE DLA DYNAMICZNYCH SUGESTII ---
const dynamicSuggestions = ref([]);
const isLoadingDynamicSuggestions = ref(false); // Główna flaga ładowania dla UI (debounce)
const dynamicSuggestionsError = ref('');       // Błąd wyświetlany użytkownikowi
const dynamicSuggestionsPolling = ref({        // Stan wewnętrzny dla logiki odpytywania
    correlationId: null,
    isActive: false, // Czy odpytywanie jest aktywne
    errorInternal: null, // Błędy specyficzne dla odpytywania
    intervalId: null
});

const REQUIRED_FIELDS_GENERAL = ['RequestID', 'Triggerdate', 'CustID', 'Barcode', 'PickUpDate', 'DeliveryType', 'Weight', 'Volume'];
const REQUIRED_FIELDS_PICKUP_ADDRESS = ['PickUpAlias', 'PickUpName', 'PickUpStreet', 'PickUpHouseNo', 'PickUpPostalCode', 'PickUpCity'];
const REQUIRED_FIELDS_DELIVERY_ADDRESS = ['DeliveryAlias', 'DeliveryName', 'DeliveryStreet', 'DeliveryHouseNo', 'DeliveryPostalCode', 'DeliveryCity'];

const addressFieldsDefinition = {
  pickup: [
    { label: 'Nazwa/Kontakt', modelKey: 'PickUpName', id: 'editPickUpName' },
    { label: 'Ulica', modelKey: 'PickUpStreet', id: 'editPickUpStreet' },
    { label: 'Nr domu', modelKey: 'PickUpHouseNo', id: 'editPickUpHouseNo' },
    { label: 'Kod pocztowy', modelKey: 'PickUpPostalCode', id: 'editPickUpPostalCode', validation: validatePostalCode },
    { label: 'Miasto', modelKey: 'PickUpCity', id: 'editPickUpCity' },
  ],
  delivery: [
    { label: 'Nazwa/Kontakt', modelKey: 'DeliveryName', id: 'editDeliveryName' },
    { label: 'Ulica', modelKey: 'DeliveryStreet', id: 'editDeliveryStreet' },
    { label: 'Nr domu', modelKey: 'DeliveryHouseNo', id: 'editDeliveryHouseNo' },
    { label: 'Kod pocztowy', modelKey: 'DeliveryPostalCode', id: 'editDeliveryPostalCode', validation: validatePostalCode },
    { label: 'Miasto', modelKey: 'DeliveryCity', id: 'editDeliveryCity' },
  ]
};

const isPayloadValid = computed(() => {
  return Object.keys(validationErrors.value).length === 0 && !payloadJsonError.value;
});

const activeAddressEditorContext = computed(() => {
    if (!editableOrderData.value || !props.error || !props.error.errorType) return null;
    const relevantContextOnError = determineAddressContextFromError(props.error, 'order_relevant');
    const requiredFieldsForContext = relevantContextOnError === 'pickup' ? REQUIRED_FIELDS_PICKUP_ADDRESS : REQUIRED_FIELDS_DELIVERY_ADDRESS;
    const hasRelevantValidationError = requiredFieldsForContext.some(fieldKey => !!validationErrors.value[fieldKey]);
    const errorTypeSuggestsEditorForContext =
        props.error.errorType === 'CONSTRAINT_VIOLATION' &&
        props.error.errorMessage &&
        ( (relevantContextOnError === 'pickup' && REQUIRED_FIELDS_PICKUP_ADDRESS.some(field => props.error.errorMessage.toLowerCase().includes(field.toLowerCase().replace("pickup","")))) ||
          (relevantContextOnError === 'delivery' && REQUIRED_FIELDS_DELIVERY_ADDRESS.some(field => props.error.errorMessage.toLowerCase().includes(field.toLowerCase().replace("delivery",""))))
        );
    const needsReviewDueToProviderError = [
        'ADDRESS_PROVIDER_NEEDS_REVIEW', 'ADDRESS_PROVIDER_INVALID', 'EXTERNAL_SERVICE_FAILURE'
    ].includes(props.error.errorType);

    if (showAddressEditorAfterSuggestion.value) return relevantContextOnError;
    if (errorTypeSuggestsEditorForContext && hasRelevantValidationError) return relevantContextOnError;
    if (needsReviewDueToProviderError) return relevantContextOnError;
    return null;
});

const showSuggestions = computed(() => {
  return props.error &&
         (props.error.errorType === 'ADDRESS_PROVIDER_NEEDS_REVIEW' ||
         (props.error.errorType === 'EXTERNAL_SERVICE_FAILURE' && props.error.addressVerificationStatus === 'NEEDS_REVIEW')) &&
         props.error.suggestedAddresses && props.error.suggestedAddresses.length > 0;
});

const showInvalidAddressMessage = computed(() => {
  return props.error &&
         (props.error.errorType === 'ADDRESS_PROVIDER_INVALID' ||
         (props.error.errorType === 'EXTERNAL_SERVICE_FAILURE' &&
          (!props.error.suggestedAddresses || props.error.suggestedAddresses.length === 0) &&
          (props.error.addressVerificationStatus === 'INVALID' || props.error.addressVerificationStatus === 'SERVICE_ERROR')));
});

const providerNameFromSuggestionsOrQuery = computed(() => {
  if (props.error?.suggestedAddresses?.length > 0 && props.error.suggestedAddresses[0].providerSource) {
    return props.error.suggestedAddresses[0].providerSource;
  }
  if (props.error?.providerRawQuery) {
    const queryLower = props.error.providerRawQuery.toLowerCase();
    if (queryLower.includes('nominatim')) return 'Nominatim';
    if (queryLower.includes('here')) return 'HERE Maps';
    if (queryLower.includes('google') || queryLower.includes('maps')) return 'Google Maps';
  }
  return null;
});

function validatePostalCode(value) {
  if (value && !/^\d{2}-\d{3}$/.test(String(value).trim())) {
    return "Niepoprawny format kodu pocztowego (oczekiwano XX-XXX).";
  }
  return null;
}

const determineAddressContextFromError = (error, baseContextType) => {
    if (!error) return 'delivery';
    if (baseContextType === 'database_dto') return 'database_dto';
    if (baseContextType === 'provider_suggestion') return 'provider_suggestion';
    let relevantContext = 'delivery';
    if (error.errorMessage) {
        const msgLower = error.errorMessage.toLowerCase();
        const pickupKeywords = ['pickup', 'nadania', 'nadawcy', 'pickuphouseno', 'pickuppostalcode', 'pickupcity', 'pickupname', 'pickupalias', 'pick up'];
        const deliveryKeywords = ['delivery', 'dostawy', 'odbiorcy', 'deliveryhouseno', 'deliverypostalcode', 'deliverycity', 'deliveryname', 'deliveryalias'];
        if (pickupKeywords.some(kw => msgLower.includes(kw))) relevantContext = 'pickup';
        else if (deliveryKeywords.some(kw => msgLower.includes(kw))) relevantContext = 'delivery';
    }
     if (error.errorType) {
        const typeUpper = error.errorType.toUpperCase();
        const pickupErrorTypes = ["PICKUP", "NADAWCY", "NADANIA"];
        const deliveryErrorTypes = ["DELIVERY", "ODBIORCY", "DOSTAWY"];
        if (pickupErrorTypes.some(pet => typeUpper.includes(pet))) relevantContext = 'pickup';
        else if (deliveryErrorTypes.some(det => typeUpper.includes(det))) relevantContext = 'delivery';
    }
    if (error.errorType === 'CONSTRAINT_VIOLATION' && error.errorMessage) {
        const msgLower = error.errorMessage.toLowerCase();
        const fieldViolationMatch = msgLower.match(/pole '([^']*)'/);
        if (fieldViolationMatch && fieldViolationMatch[1]) {
            const violatedField = fieldViolationMatch[1].toLowerCase();
            if (violatedField.startsWith('pickup')) relevantContext = 'pickup';
            else if (violatedField.startsWith('delivery')) relevantContext = 'delivery';
        }
    }
    if (baseContextType === 'order_relevant') return relevantContext;
    if (baseContextType === 'order_pickup') return 'pickup';
    if (baseContextType === 'order_delivery') return 'delivery';
    if (baseContextType === 'order') return relevantContext;
    return relevantContext;
};

const determineAddressContextTitle = (error, baseContextType) => {
    const context = determineAddressContextFromError(error, baseContextType);
    if (context === 'pickup') return "Adres Nadania";
    if (context === 'delivery') return "Adres Dostawy";
    return "Adres w Zleceniu";
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const validateField = (data, fieldName, errorsObject, isRequired = true, customValidator = null) => {
  const value = data ? data[fieldName] : undefined;
  if (isRequired && (value === undefined || value === null || String(value).trim() === '')) {
    errorsObject[fieldName] = `Pole ${fieldName} jest wymagane.`;
    return false;
  }
  if (!isRequired && (value === undefined || value === null || String(value).trim() === '')) {
    delete errorsObject[fieldName];
    return true;
  }
  if (value && customValidator) {
    const errorMsg = customValidator(String(value));
    if (errorMsg) {
      errorsObject[fieldName] = errorMsg;
      return false;
    }
  }
  delete errorsObject[fieldName];
  return true;
};

const validateEditablePayload = () => {
  const errors = {};
  if (!editableOrderData.value) {
    errors.general = "Payload JSON jest pusty lub nie został poprawnie sparsowany. Nie można przeprowadzić walidacji pól.";
    validationErrors.value = errors;
    return;
  }
  const data = editableOrderData.value;
  REQUIRED_FIELDS_GENERAL.forEach(field => validateField(data, field, errors));
  REQUIRED_FIELDS_PICKUP_ADDRESS.forEach(field => {
    const fieldDef = addressFieldsDefinition.pickup.find(f => f.modelKey === field);
    validateField(data, field, errors, true, fieldDef?.validation);
  });
  REQUIRED_FIELDS_DELIVERY_ADDRESS.forEach(field => {
    const fieldDef = addressFieldsDefinition.delivery.find(f => f.modelKey === field);
    validateField(data, field, errors, true, fieldDef?.validation);
  });
  validationErrors.value = errors;
};

const clearDynamicSuggestionsPollingState = () => {
    if (dynamicSuggestionsPolling.value.intervalId) {
        clearInterval(dynamicSuggestionsPolling.value.intervalId);
    }
    dynamicSuggestionsPolling.value = { correlationId: null, isActive: false, errorInternal: null, intervalId: null };
};

const _pollDynamicSuggestions = async (correlationId) => {
    const MAX_POLLS = 15;
    const POLL_INTERVAL = 2000;
    let polls = 0;

    dynamicSuggestionsPolling.value.correlationId = correlationId;
    dynamicSuggestionsPolling.value.isActive = true;
    dynamicSuggestionsPolling.value.errorInternal = null;

    return new Promise((resolve, reject) => {
        dynamicSuggestionsPolling.value.intervalId = setInterval(async () => {
            polls++;
            if (!dynamicSuggestionsPolling.value.isActive || polls > MAX_POLLS) {
                if (polls > MAX_POLLS && dynamicSuggestionsPolling.value.isActive) {
                    dynamicSuggestionsPolling.value.errorInternal = `Timeout oczekiwania na dynamiczne sugestie (ID: ${correlationId?.substring(0,8)}).`;
                }
                clearDynamicSuggestionsPollingState();
                return reject(new Error(dynamicSuggestionsPolling.value.errorInternal || 'Polling anulowany lub przekroczono limit prób.'));
            }

            try {
                const res = await apiClient.get(`/api/admin/address-verification/operations/${correlationId}`);
                if (res.data && res.data.status === 'COMPLETED') {
                    clearDynamicSuggestionsPollingState();
                    resolve(res.data.result);
                } else if (res.data && res.data.status === 'FAILED') {
                    clearDynamicSuggestionsPollingState();
                    reject(new Error(res.data.errorDetails || 'Operacja pobierania sugestii nie powiodła się.'));
                }
                // Kontynuuj polling dla PENDING/PROCESSING
            } catch (pollError) {
                clearDynamicSuggestionsPollingState();
                reject(pollError.response?.data?.error || pollError.message || 'Błąd sieci podczas odpytywania o status sugestii.');
            }
        }, POLL_INTERVAL);
    });
};


const fetchDynamicSuggestionsInternal = async (addressDataForQuery) => {
  isLoadingDynamicSuggestions.value = true;
  dynamicSuggestions.value = [];
  dynamicSuggestionsError.value = 'Inicjowanie pobierania sugestii...';
  clearDynamicSuggestionsPollingState(); // Wyczyść poprzedni polling

  try {
    const queryParams = {
      street: String(addressDataForQuery.street || '').trim(),
      houseNumber: String(addressDataForQuery.houseNumber || '').trim(),
      city: String(addressDataForQuery.city || '').trim(),
      postalCode: String(addressDataForQuery.postalCode || '').trim(),
      country: 'Polska',
    };
    Object.keys(queryParams).forEach(key => { if (!queryParams[key]) delete queryParams[key]; });

    if (Object.keys(queryParams).length < 2 && !queryParams.street && !queryParams.city && !queryParams.postalCode) {
      dynamicSuggestionsError.value = 'Zbyt mało danych do wyszukania sugestii.';
      isLoadingDynamicSuggestions.value = false;
      return;
    }

    const initResponse = await apiClient.post('/api/admin/address-verification/suggest-on-demand', queryParams);
    const operationCorrelationId = initResponse.data.correlationId;

    if (!operationCorrelationId) {
      throw new Error("Nie otrzymano CorrelationID dla operacji dynamicznych sugestii.");
    }
    dynamicSuggestionsError.value = `Przetwarzanie dynamicznych sugestii (ID: ${operationCorrelationId.substring(0,8)})...`;

    const resultData = await _pollDynamicSuggestions(operationCorrelationId);

    if (resultData && typeof resultData.status === 'string' && Array.isArray(resultData.suggestions)) {
        const providerStatus = resultData.status.toUpperCase();
        if (providerStatus === 'SERVICE_ERROR' || providerStatus === 'INVALID') {
            dynamicSuggestions.value = resultData.suggestions.length > 0 ? resultData.suggestions : [];
            dynamicSuggestionsError.value = resultData.message || 'Dostawca zwrócił błąd lub brak wyników.';
        } else { // VALID lub NEEDS_REVIEW
            dynamicSuggestions.value = resultData.suggestions;
            dynamicSuggestionsError.value = (providerStatus === 'NEEDS_REVIEW' && resultData.message) ? `Uwaga od dostawcy: ${resultData.message}` : '';
        }
        if (dynamicSuggestions.value.length === 0 && !dynamicSuggestionsError.value) {
           dynamicSuggestionsError.value = 'Brak dynamicznych sugestii dla wprowadzonych danych.';
        }
    } else {
        dynamicSuggestions.value = [];
        dynamicSuggestionsError.value = 'Nieoczekiwany format wyniku dynamicznych sugestii.';
    }

  } catch (error) {
    console.error("Błąd podczas pobierania/przetwarzania dynamicznych sugestii:", error);
    dynamicSuggestionsError.value = error.message || 'Błąd serwera podczas pobierania dynamicznych sugestii.';
    dynamicSuggestions.value = [];
  } finally {
    isLoadingDynamicSuggestions.value = false;
    // Upewnij się, że isActive jest false jeśli nie było błędu krytycznego w pollDynamicSuggestions, który by to zrobił
    if (dynamicSuggestionsPolling.value.isActive && !dynamicSuggestionsPolling.value.errorInternal && !dynamicSuggestionsPolling.value.intervalId) {
        dynamicSuggestionsPolling.value.isActive = false;
    }
  }
};

const debouncedFetchDynamicSuggestions = debounce(fetchDynamicSuggestionsInternal, 850);

watch(() => props.resubmitMessage, (newVal) => localResubmitMessage.value = newVal, { immediate: true });
watch(() => props.resubmitMessageType, (newVal) => localResubmitMessageType.value = newVal, { immediate: true });
watch(() => props.emailSendMessage, (newVal) => localEmailSendMessage.value = newVal, { immediate: true });
watch(() => props.emailSendMessageType, (newVal) => localEmailSendMessageType.value = newVal, { immediate: true });

watch(() => props.error, (newError, oldError) => {
  const payloadSource = newError?.originalAddressJson || newError?.rawPayload || '';
  selectedSuggestionIndex.value = null;
  showAddressEditorAfterSuggestion.value = false;
  lastSelectedSuggestionSource.value = null;
  localResubmitMessage.value = '';
  localEmailSendMessage.value = '';
  dynamicSuggestions.value = [];
  dynamicSuggestionsError.value = '';
  clearDynamicSuggestionsPollingState();


  if (newError && (!oldError || newError.eventId !== oldError.eventId)) {
    validationErrors.value = {};
    if (payloadSource) {
      try {
        const parsed = JSON.parse(payloadSource);
        editableOrderData.value = { ...parsed };
        originalPayloadForComparison.value = JSON.stringify(parsed, null, 2);
        editablePayload.value = JSON.stringify(parsed, null, 2);
        payloadJsonError.value = '';
      } catch (e) {
        editablePayload.value = payloadSource;
        originalPayloadForComparison.value = payloadSource;
        editableOrderData.value = null;
        payloadJsonError.value = "Nie można sparsować początkowego payloadu JSON. Sprawdź jego poprawność.";
        validationErrors.value = { general: "Nie można sparsować początkowego payloadu JSON." };
      }
    } else {
      editablePayload.value = '';
      originalPayloadForComparison.value = '';
      editableOrderData.value = null;
      validationErrors.value = { general: "Brak payloadu do edycji." };
    }
    nextTick(() => {
        validateEditablePayload();
    });
  }
}, { immediate: true, deep: true });

watch(editablePayload, (newValue) => {
  if (!String(localResubmitMessage.value).startsWith("Wybrano sugestię")) {
    localResubmitMessage.value = '';
  }
  if (!newValue) {
    payloadJsonError.value = '';
    if (editableOrderData.value !== null) editableOrderData.value = null;
    validationErrors.value = { general: "Payload jest pusty." };
    return;
  }
  try {
    const parsedData = JSON.parse(newValue);
    payloadJsonError.value = '';
    if (newValue !== JSON.stringify(editableOrderData.value, null, 2)) {
      editableOrderData.value = parsedData;
    } else {
      validateEditablePayload();
    }
  } catch (e) {
    payloadJsonError.value = 'Niepoprawny format JSON. Popraw błędy w edytorze tekstowym.';
    validationErrors.value = { general: "Niepoprawny format JSON w edytorze tekstowym." };
  }
});

watch(editableOrderData, (newData, oldData) => {
  if (newData) {
    const newPayloadString = JSON.stringify(newData, null, 2);
    if (newPayloadString !== editablePayload.value) {
      editablePayload.value = newPayloadString;
    }
    validateEditablePayload();

    const context = activeAddressEditorContext.value;
    if (context && newData !== oldData) {
        const prefix = context === 'pickup' ? 'PickUp' : 'Delivery';
        const addressQueryData = {
            street: newData[`${prefix}Street`],
            houseNumber: newData[`${prefix}HouseNo`],
            city: newData[`${prefix}City`],
            postalCode: newData[`${prefix}PostalCode`],
        };
        if (String(addressQueryData.street||'').trim().length > 2 ||
            String(addressQueryData.city||'').trim().length > 2 ||
            String(addressQueryData.postalCode||'').trim().length >= 5) {
             debouncedFetchDynamicSuggestions(addressQueryData);
        } else {
            dynamicSuggestions.value = [];
            dynamicSuggestionsError.value = '';
            clearDynamicSuggestionsPollingState(); // Anuluj poprzednie odpytywanie jeśli dane zbyt krótkie
        }
    }
  } else if (editablePayload.value) {
    editablePayload.value = '';
  }
}, { deep: true });

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    clearDynamicSuggestionsPollingState(); // Wyczyść przy odmontowaniu komponentu
});

const handleClose = () => {
  emit('close');
  selectedSuggestionIndex.value = null;
  lastSelectedSuggestionSource.value = null;
  showAddressEditorAfterSuggestion.value = false;
  dynamicSuggestions.value = [];
  dynamicSuggestionsError.value = '';
  clearDynamicSuggestionsPollingState();
};

const triggerResubmit = () => {
  validateEditablePayload();
  if (!isPayloadValid.value) {
    localResubmitMessage.value = "Formularz zlecenia zawiera błędy lub JSON jest niepoprawny. Popraw je przed wysłaniem.";
    localResubmitMessageType.value = 'error';
    return;
  }
  const hasPayloadChanged = editablePayload.value !== originalPayloadForComparison.value;
  if (hasPayloadChanged) {
    if (!confirm("Dane zlecenia zostały zmodyfikowane. Czy na pewno chcesz je zapisać i przesłać ponownie?")) {
      return;
    }
  } else {
    if (!confirm("Dane zlecenia nie zostały zmienione. Czy na pewno chcesz przesłać oryginalne zlecenie ponownie?")) {
      return;
    }
  }
  localResubmitMessage.value = '';
  localEmailSendMessage.value = '';
  emit('resubmit', {
    eventId: props.error.eventId,
    correctedRawPayload: editablePayload.value,
  });
};

const triggerSendVerificationEmail = () => {
  validateEditablePayload();
  if (props.error.errorType === 'ADDRESS_CUSTOMER_VERIFICATION_PENDING') {
      localEmailSendMessage.value = "Email weryfikacyjny został już prawdopodobnie wysłany. Sprawdź status.";
      localEmailSendMessageType.value = 'info';
      return;
  }
  if (!isPayloadValid.value) {
     localEmailSendMessage.value = "Payload JSON zlecenia zawiera błędy lub jest niepoprawny. Popraw go przed wysłaniem emaila do klienta.";
     localEmailSendMessageType.value = 'error';
     return;
  }
  localResubmitMessage.value = '';
  localEmailSendMessage.value = '';
  emit('send-verification-email', { eventId: props.error.eventId });
};

const selectSuggestion = (suggestion, index, source) => {
  selectedSuggestionIndex.value = index;
  lastSelectedSuggestionSource.value = source;
  if (!editableOrderData.value) {
    console.error("ErrorDetailsModal: editableOrderData jest null, nie można zaktualizować adresu na podstawie sugestii.");
    localResubmitMessage.value = "BŁĄD KRYTYCZNY: Brak danych zlecenia do aktualizacji.";
    localResubmitMessageType.value = 'error';
    return;
  }

  const orderDataCopy = { ...editableOrderData.value };
  const addressContext = determineAddressContextFromError(props.error, 'order_relevant');
  const prefix = addressContext === 'pickup' ? 'PickUp' : 'Delivery';

  orderDataCopy[`${prefix}Street`] = suggestion.street || '';
  orderDataCopy[`${prefix}HouseNo`] = suggestion.houseNumber || '';
  orderDataCopy[`${prefix}PostalCode`] = suggestion.postalCode || '';
  orderDataCopy[`${prefix}City`] = suggestion.city || '';

  editableOrderData.value = orderDataCopy;
  showAddressEditorAfterSuggestion.value = true;

  if (source === 'dynamic') {
    dynamicSuggestions.value = []; // Wyczyść dynamiczne sugestie po wyborze
    clearDynamicSuggestionsPollingState(); // Zatrzymaj odpytywanie
  }
  localResubmitMessage.value = `Wybrano ${lastSelectedSuggestionSource.value === 'initial' ? 'początkową' : 'dynamiczną'} sugestię. Pola adresu ${addressContext === 'pickup' ? 'nadania' : 'dostawy'} zostały zaktualizowane. Sprawdź i uzupełnij ewentualne braki, zwłaszcza Nazwę/Kontakt.`;
  localResubmitMessageType.value = 'info';
};

const handleKeydown = (event) => {
  if (event.key === 'Escape') handleClose();
};

const isAddressErrorType = (errorType) => {
  const types = [
    'ADDRESS_ALIAS_MISMATCH_DB', 'ADDRESS_PROVIDER_NEEDS_REVIEW', 'ADDRESS_PROVIDER_INVALID',
    'ADDRESS_CUSTOMER_VERIFICATION_PENDING', 'EXTERNAL_SERVICE_FAILURE', 'ADDRESS_DB_ERROR'
  ];
  if (errorType === 'CONSTRAINT_VIOLATION' && props.error && props.error.errorMessage) {
    const msg = props.error.errorMessage.toLowerCase();
    const addressKeywords = ['pickup', 'delivery', 'street', 'houseno', 'city', 'postalcode', 'alias',
                             'pickuphouseno', 'deliveryhouseno', 'pickuppostalcode', 'deliverypostalcode',
                             'pickupcity', 'deliverycity', 'pickupname', 'deliveryname'];
    if (addressKeywords.some(keyword => msg.includes(keyword.replace(/pickup|delivery/gi, '')))) {
      return true;
    }
  }
  return types.includes(errorType);
};

const canTriggerSendVerificationEmail = (errorType) => {
  return [
    'ADDRESS_ALIAS_MISMATCH_DB', 'ADDRESS_PROVIDER_NEEDS_REVIEW',
    'ADDRESS_PROVIDER_INVALID', 'EXTERNAL_SERVICE_FAILURE', 'CONSTRAINT_VIOLATION', 'ADDRESS_DB_ERROR'
  ].includes(errorType) && errorType !== 'ADDRESS_CUSTOMER_VERIFICATION_PENDING';
};

const getErrorTypeClass = (errorType) => {
    let base = 'px-2.5 py-1 rounded-full text-xs font-bold leading-tight inline-block ';
    if (errorType === 'CONSTRAINT_VIOLATION' && props.error && props.error.errorMessage) {
        const msg = props.error.errorMessage.toLowerCase();
        const addressKeywords = ['pickup', 'delivery', 'street', 'houseno', 'city', 'postalcode', 'alias', 'pickuphouseno', 'deliveryhouseno', 'pickuppostalcode', 'deliverypostalcode', 'pickupcity', 'deliverycity', 'pickupname', 'deliveryname'];
        if (addressKeywords.some(keyword => msg.includes(keyword.replace(/pickup|delivery/i, '')))) {
            return base + 'bg-orange-100 text-orange-600 border border-orange-200';
        }
        return base + 'bg-red-100 text-red-600 border border-red-200';
    }
    if (['ADDRESS_ALIAS_MISMATCH_DB', 'ADDRESS_PROVIDER_NEEDS_REVIEW', 'ADDRESS_PROVIDER_INVALID'].includes(errorType)) return base + 'bg-orange-100 text-orange-600 border border-orange-200';
    if (errorType === 'ADDRESS_CUSTOMER_VERIFICATION_PENDING') return base + 'bg-yellow-100 text-yellow-600 border border-yellow-200';
    if (['VALIDATION', 'DESERIALIZATION_ERROR'].includes(errorType)) return base + 'bg-red-100 text-red-600 border border-red-200';
    if (['PROCESSING', 'LISTENER_EXECUTION_FAILURE', 'EXTERNAL_SERVICE_FAILURE', 'ADDRESS_DB_ERROR'].includes(errorType)) return base + 'bg-purple-100 text-purple-600 border border-purple-200';
    return base + 'bg-slate-100 text-slate-600 border border-slate-200';
};
</script>

<style scoped>
/* Styl dla animacji ładowania, jeśli potrzebny gdzieś indziej */
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* Można dodać dodatkowe style specyficzne dla modala, jeśli potrzebne */
</style>