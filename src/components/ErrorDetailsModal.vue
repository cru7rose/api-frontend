<template>
  <div class="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" @click.self="emit('close')">
    <div v-if="isLoadingDetails" class="text-center text-white">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto"></div>
      <p class="mt-3">Ładowanie szczegółów błędu...</p>
    </div>
    <div v-else-if="error" class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
      <header class="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Szczegóły Błędu</h2>
          <p class="text-xs text-slate-500 font-mono mt-1">Event ID: {{ error.eventId }}</p>
        </div>
        <button @click="emit('close')" class="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <svg class="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main class="p-5 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold text-lg text-slate-700 mb-3 pb-2 border-b">Informacje o Błędzie</h3>
            <div class="space-y-3 text-sm">
              <p><strong class="text-slate-500 w-32 inline-block">Barcode:</strong> <span class="font-medium text-slate-800">{{ error.barcode }}</span></p>
              <p><strong class="text-slate-500 w-32 inline-block">Typ Błędu:</strong> <span class="font-semibold text-red-600">{{ error.errorType }}</span></p>
              <p><strong class="text-slate-500 w-32 inline-block">Status Weryf.:</strong> <span class="font-semibold text-orange-600">{{ error.addressVerificationStatus }}</span></p>
              <p><strong class="text-slate-500 w-32 inline-block align-top">Wiadomość:</strong> <span class="text-slate-800">{{ error.errorMessage }}</span></p>
            </div>

            <div v-if="addressJsonSnippet" class="mt-6">
                <h4 class="font-semibold text-md text-slate-700 mb-2">Fragment JSON zlecenia (dane do weryfikacji):</h4>
                <div class="bg-gray-800 border border-gray-700 text-green-300 text-xs p-3 rounded-md overflow-auto max-h-48 font-mono">
                    <pre><code>{{ addressJsonSnippet }}</code></pre>
                </div>
            </div>
            <div v-if="error.suggestedAddresses && error.suggestedAddresses.length" class="mt-6">
              <h4 class="font-semibold text-md text-slate-700 mb-2">Początkowe sugestie od dostawcy ({{ error.suggestedAddresses[0].providerSource }}):</h4>
              <ul class="border border-slate-200 rounded-lg bg-white">
                <li v-for="(suggestion, index) in error.suggestedAddresses" :key="index" @click="selectInitialSuggestion(suggestion)" class="p-3 border-b last:border-b-0 text-xs text-slate-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                  {{ suggestion.fullAddressLabel }} <span class="font-bold text-indigo-600">(Score: {{ (suggestion.matchScore || 0).toFixed(2) }})</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="space-y-6">
            <AddressCorrectionForm title="Uzupełnij / Popraw Dane Adresu Nadania:" :address-data="editablePickupAddress" @update="handleFormUpdate('pickup', $event)" />
            <AddressCorrectionForm title="Uzupełnij / Popraw Dane Adresu Dostawy:" :address-data="editableDeliveryAddress" @update="handleFormUpdate('delivery', $event)" />
          </div>
        </div>
      </main>

      <footer class="p-5 border-t border-slate-200 flex-shrink-0 bg-slate-100/70 rounded-b-2xl">
        <div v-if="resubmitMessage" :class="resubmitMessageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="p-3 rounded-lg text-sm mb-4 text-center">
          {{ resubmitMessage }}
        </div>
        <div class="flex justify-between items-center">
          <button @click="emit('close')" type="button" class="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
            Zamknij
          </button>
          <div class="flex items-center space-x-3">
            <button v-if="isAddressError" @click="handleSendEmail" :disabled="isActionLoading" class="px-5 py-2.5 text-sm font-medium text-amber-800 bg-amber-100 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-wait">
              <span v-if="!isEmailSending">Wyślij Email Weryfikacyjny</span>
              <span v-else>Wysyłanie...</span>
            </button>
            <button @click="handleResubmit" :disabled="isActionLoading" class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
              <span v-if="!isResubmitting">Prześlij Ponownie Poprawione Dane</span>
              <span v-else>Przetwarzanie...</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useErrorStore } from '@/stores/errorStore';
import AddressCorrectionForm from '@/components/forms/AddressCorrectionForm.vue';

const props = defineProps({
  errorId: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['close', 'order-resubmitted']);

const errorStore = useErrorStore();

const error = ref(null);
const isLoadingDetails = ref(true);
const isResubmitting = ref(false);
const isEmailSending = ref(false);
const resubmitMessage = ref('');
const resubmitMessageType = ref('');

const isActionLoading = computed(() => isResubmitting.value || isEmailSending.value);
const isAddressError = computed(() => error.value?.errorType?.includes('ADDRESS'));

const editablePickupAddress = reactive({ alias: '', street: '', houseNo: '', postalCode: '', city: '' });
const editableDeliveryAddress = reactive({ alias: '', street: '', houseNo: '', postalCode: '', city: '' });

const addressJsonSnippet = computed(() => {
  if (!error.value || !error.value.originalAddressJson) {
    return null;
  }
  try {
    const data = JSON.parse(error.value.originalAddressJson);
    let addressSnippet = {};

    if (error.value.errorType?.includes('PICKUP')) {
        addressSnippet = {
            PickUpAlias: data.PickUpAlias,
            PickUpName: data.PickUpName,
            PickUpStreet: data.PickUpStreet,
            PickUpHouseNo: data.PickUpHouseNo,
            PickUpPostalCode: data.PickUpPostalCode,
            PickUpCity: data.PickUpCity,
        };
    } else {
        addressSnippet = {
            DeliveryAlias: data.DeliveryAlias,
            DeliveryName: data.DeliveryName,
            DeliveryStreet: data.DeliveryStreet,
            DeliveryHouseNo: data.DeliveryHouseNo,
            DeliveryPostalCode: data.DeliveryPostalCode,
            DeliveryCity: data.DeliveryCity,
        };
    }
    return JSON.stringify(addressSnippet, null, 2);
  } catch (e) {
    console.error("Błąd parsowania JSON dla snippetu:", e);
    return "Błąd formatowania danych JSON.";
  }
});

const parseAndSetFormData = () => {
  if (!error.value || !error.value.originalAddressJson) return;
  try {
    const data = JSON.parse(error.value.originalAddressJson);
    Object.assign(editablePickupAddress, {
      alias: data.PickUpAlias || '',
      street: data.PickUpStreet || '',
      houseNo: data.PickUpHouseNo || '',
      postalCode: data.PickUpPostalCode || '',
      city: data.PickUpCity || '',
    });
    Object.assign(editableDeliveryAddress, {
      alias: data.DeliveryAlias || '',
      street: data.DeliveryStreet || '',
      houseNo: data.DeliveryHouseNo || '',
      postalCode: data.DeliveryPostalCode || '',
      city: data.DeliveryCity || '',
    });
  } catch (e) {
    console.error("Błąd parsowania originalAddressJson:", e);
    resubmitMessage.value = "Błąd odczytu oryginalnych danych zlecenia.";
    resubmitMessageType.value = "error";
  }
};

onMounted(async () => {
  isLoadingDetails.value = true;
  try {
    await errorStore.fetchErrorDetails(props.errorId);
    error.value = errorStore.selectedRequestDetails;
    parseAndSetFormData();
  } catch (e) {
    resubmitMessage.value = "Nie udało się załadować szczegółów błędu.";
    resubmitMessageType.value = "error";
  } finally {
    isLoadingDetails.value = false;
  }
});

const handleFormUpdate = (type, data) => {
  if (type === 'pickup') {
    Object.assign(editablePickupAddress, data);
  } else {
    Object.assign(editableDeliveryAddress, data);
  }
};

const selectInitialSuggestion = (suggestion) => {
  if (confirm(`Czy na pewno chcesz użyć adresu: "${suggestion.fullAddressLabel}"? Spowoduje to nadpisanie danych w formularzu.`)) {
    const targetForm = error.value.errorType.includes('PICKUP') ? editablePickupAddress : editableDeliveryAddress;
    targetForm.street = suggestion.street || '';
    targetForm.houseNo = suggestion.houseNumber || '';
    targetForm.postalCode = suggestion.postalCode || '';
    targetForm.city = suggestion.city || '';
  }
};

const handleResubmit = async () => {
  if (!error.value) return;
  isResubmitting.value = true;
  resubmitMessage.value = '';

  try {
    const originalData = JSON.parse(error.value.originalAddressJson);
    const correctedData = {
      ...originalData,
      PickUpAlias: editablePickupAddress.alias,
      PickUpStreet: editablePickupAddress.street,
      PickUpHouseNo: editablePickupAddress.houseNo,
      PickUpPostalCode: editablePickupAddress.postalCode,
      PickUpCity: editablePickupAddress.city,
      DeliveryAlias: editableDeliveryAddress.alias,
      DeliveryStreet: editableDeliveryAddress.street,
      DeliveryHouseNo: editableDeliveryAddress.houseNo,
      DeliveryPostalCode: editableDeliveryAddress.postalCode,
      DeliveryCity: editableDeliveryAddress.city,
      ResubmissionOverride: true,
    };
    const payload = {
      errorEventId: error.value.eventId,
      correctedRawPayload: JSON.stringify(correctedData)
    };
    const message = await errorStore.resubmitRequest(payload);
    resubmitMessage.value = message;
    resubmitMessageType.value = 'success';
    setTimeout(() => {
      emit('order-resubmitted');
    }, 2000);
  } catch (e) {
    console.error("Błąd podczas ponownego przesyłania:", e);
    resubmitMessage.value = e.message || "Wystąpił nieoczekiwany błąd.";
    resubmitMessageType.value = 'error';
  } finally {
    isResubmitting.value = false;
  }
};

const handleSendEmail = async () => {
  if (!error.value) return;
  isEmailSending.value = true;
  resubmitMessage.value = '';
  try {
    const message = await errorStore.sendVerificationEmailToCustomer(error.value.eventId);
    resubmitMessage.value = message;
    resubmitMessageType.value = 'success';
  } catch(e) {
    resubmitMessage.value = e.message || "Nie udało się wysłać emaila.";
    resubmitMessageType.value = 'error';
  } finally {
    isEmailSending.value = false;
  }
};
</script>