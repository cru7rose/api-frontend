<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" @click.self="$emit('close')">
    <div class="bg-white p-8 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
      <h2 class="text-2xl font-bold mb-6 text-slate-800">Szczegóły błędu i akcje</h2>

      <div v-if="notificationMessage" :class="notificationClass" class="p-4 rounded-md mb-4 text-white transition-all">
        {{ notificationMessage }}
      </div>

      <div class="flex-grow overflow-y-auto pr-4 -mr-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold mb-2 text-slate-700">Oryginalny Payload</h3>
            <pre class="bg-slate-100 p-4 rounded-lg text-sm whitespace-pre-wrap break-all">{{ originalPayloadFormatted }}</pre>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-2 text-slate-700">Edytowalny Payload</h3>
            <textarea v-model="editablePayload" class="w-full h-64 p-3 border border-slate-300 rounded-lg font-mono text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            <p v-if="isJsonInvalid" class="text-red-600 text-sm mt-1">Wprowadzony tekst nie jest poprawnym formatem JSON.</p>
          </div>
        </div>

        <div class="mt-6 border-t pt-6">
          <h3 class="text-lg font-semibold mb-4 text-slate-700">Opcje zapisu i powiadomień</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label for="addressAlias" class="block text-sm font-medium text-slate-700 mb-1">Zapisz adres pod nową nazwą (alias)</label>
              <p class="text-xs text-slate-500 mb-2">Użyj, jeśli poprawiłeś adres i chcesz go zapisać do późniejszego wykorzystania.</p>
              <input
                type="text"
                id="addressAlias"
                v-model="addressAlias"
                placeholder="np. 'Magazyn główny klienta X'"
                class="p-2.5 w-full border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Powiadom klienta</label>
              <p class="text-xs text-slate-500 mb-2">Wyślij e-mail do klienta z prośbą o weryfikację tego adresu.</p>
              <button
                @click="handleSendEmail"
                :disabled="isEmailButtonDisabled"
                class="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                <span>{{ emailButtonText }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t flex justify-end space-x-4">
        <button @click="$emit('close')" class="px-6 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">Anuluj</button>
        <button @click="handleResubmit" :disabled="isJsonInvalid || isSubmitting" class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">
          <span v-if="isSubmitting">Przetwarzanie...</span>
          <span v-else>Zapisz i Prześlij Ponownie</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import apiClient from '@/services/api';

const props = defineProps({
  error: { type: Object, required: true }
});
const emit = defineEmits(['close', 'resubmit-event', 'status-updated']);

const editablePayload = ref('');
const addressAlias = ref('');
const isSubmitting = ref(false);
const isSendingEmail = ref(false);
const notificationMessage = ref('');
const notificationType = ref('');

watch(() => props.error, (newError) => {
  if (newError) {
    try {
      editablePayload.value = JSON.stringify(JSON.parse(newError.rawPayload), null, 2);
    } catch (e) {
      editablePayload.value = newError.rawPayload;
    }
    addressAlias.value = '';
    notificationMessage.value = '';
  }
}, { immediate: true, deep: true });

const originalPayloadFormatted = computed(() => {
    try { return JSON.stringify(JSON.parse(props.error.rawPayload), null, 2); }
    catch(e) { return props.error.rawPayload; }
});
const editablePayloadObject = computed(() => {
  try { return JSON.parse(editablePayload.value); }
  catch (e) { return null; }
});
const isJsonInvalid = computed(() => editablePayloadObject.value === null);
const notificationClass = computed(() => ({
  'bg-green-500': notificationType.value === 'success',
  'bg-red-500': notificationType.value === 'error',
  'bg-blue-500': notificationType.value === 'info',
}));

const isEmailButtonDisabled = computed(() => {
  return isSendingEmail.value || props.error?.addressVerificationStatus === 'CUSTOMER_EMAIL_SENT';
});
const emailButtonText = computed(() => {
  if (props.error?.addressVerificationStatus === 'CUSTOMER_EMAIL_SENT') return 'E-mail już wysłany';
  if (isSendingEmail.value) return 'Wysyłanie...';
  return 'Wyślij e-mail weryfikacyjny';
});

const handleSendEmail = async () => {
  isSendingEmail.value = true;
  notificationMessage.value = 'Wysyłanie e-maila do klienta...';
  notificationType.value = 'info';
  try {
    const response = await apiClient.post(`/api/tes/address-admin/error/${props.error.eventId}/send-verification-email`);
    notificationMessage.value = response.data || 'E-mail weryfikacyjny został pomyślnie wysłany.';
    notificationType.value = 'success';
    emit('status-updated', props.error.eventId); // Emituj zdarzenie, aby odświeżyć listę błędów
  } catch (error) {
    notificationMessage.value = error.response?.data || 'Wystąpił błąd podczas wysyłania e-maila.';
    notificationType.value = 'error';
  } finally {
    isSendingEmail.value = false;
  }
};

const handleResubmit = async () => {
  if (isJsonInvalid.value) {
    notificationMessage.value = "Wprowadzony tekst nie jest poprawnym formatem JSON.";
    notificationType.value = "error";
    return;
  }
  isSubmitting.value = true;
  notificationMessage.value = '';

  if (addressAlias.value.trim()) {
    try {
      const payload = editablePayloadObject.value;
      const addressData = payload?.details?.delivery?.address || payload?.details?.pickup?.address; // Sprawdź oba adresy
      const custId = payload?.details?.custId;
      const name = payload?.details?.delivery?.name || payload?.details?.pickup?.name;

      if (!addressData || !custId) {
        throw new Error("Nie znaleziono danych adresowych lub CustID w edytowanym payloadzie.");
      }

      const addressDto = {
        custId: custId,
        alias: addressAlias.value.trim(),
        name: name,
        street: addressData.street,
        houseNo: addressData.houseNumber,
        postalCode: addressData.postalCode,
        city: addressData.city,
      };

      await apiClient.post('/api/danxils/admin/addresses/save-with-alias', addressDto);
      notificationMessage.value = `Adres pomyślnie zapisano z aliasem: "${addressAlias.value.trim()}"`;
      notificationType.value = 'success';
    } catch (error) {
      notificationMessage.value = error.response?.data || "Błąd podczas zapisu adresu z aliasem.";
      notificationType.value = 'error';
      isSubmitting.value = false;
      return;
    }
  }

  emit('resubmit-event', {
    eventId: props.error.eventId,
    correctedRawPayload: editablePayload.value
  });

  setTimeout(() => {
    isSubmitting.value = false;
  }, 2000);
};
</script>