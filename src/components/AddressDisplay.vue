<template>
  <div class="p-3 rounded-md shadow-sm" :class="containerClasses">
    <strong class="block text-sm font-semibold mb-2" :class="titleClasses">{{ title }}</strong>
    <div v-if="parsedAddress && !parsingError" class="space-y-1 text-xs">
      <div v-for="field in displayFields" :key="field.key" class="flex items-baseline">
        <span class="text-slate-500 w-24 sm:w-28 shrink-0">{{ field.label }}:</span>
        <span
          class="font-medium break-words"
          :class="getFieldClass(field.key, parsedAddress[field.key])"
        >
          {{ parsedAddress[field.key] || 'N/A' }}
        </span>
      </div>
      <div v-if="!hasAddressData(parsedAddress) && !parsingError" class="text-xs text-slate-400 italic mt-2">
        (Brak danych adresowych w źródle)
      </div>
    </div>
    <div v-else-if="parsingError" class="text-xs text-red-500 italic">
      {{ parsingError }}
    </div>
    <div v-else class="text-xs text-slate-400 italic">
      Brak danych adresowych.
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  addressString: { type: String, default: '' },
  compareToAddressString: { type: String, default: '' },
  addressContext: { type: String, default: 'delivery' }, // 'pickup', 'delivery', 'database_dto', 'here_suggestion', 'provider_suggestion'
  highlightAsSource: { type: String, default: 'neutral' }
});

const parsingError = ref(null);

const displayFields = [
  { key: 'name', label: 'Nazwa/Kontakt' },
  { key: 'street', label: 'Ulica' },
  { key: 'houseNumber', label: 'Nr domu' },
  { key: 'postalCode', label: 'Kod pocztowy' },
  { key: 'city', label: 'Miasto' },
  { key: 'countryName', label: 'Kraj' }
];

const normalizeString = (str) => {
  return str ? String(str).trim().toLowerCase() : '';
};

const parseAddressDataInternal = (jsonString, context, errorObject) => {
  if (!jsonString) {
    errorObject.value = 'Brak danych wejściowych (null lub pusty string).';
    return null;
  }
  try {
    const data = JSON.parse(jsonString);
    errorObject.value = null;

    if (context === 'pickup') {
      return {
        street: data.PickUpStreet,
        houseNumber: data.PickUpHouseNo,
        postalCode: data.PickUpPostalCode,
        city: data.PickUpCity,
        name: data.PickUpName,
        countryName: data.PickUpCountry || ''
      };
    } else if (context === 'delivery') {
      return {
        street: data.DeliveryStreet,
        houseNumber: data.DeliveryHouseNo,
        postalCode: data.DeliveryPostalCode,
        city: data.DeliveryCity,
        name: data.DeliveryName,
        countryName: data.DeliveryCountry || ''
      };
    } else if (context === 'database_dto') {
      return {
        street: data.street,
        houseNumber: data.houseNo,
        postalCode: data.postalCode,
        city: data.city,
        name: data.name || '',
        countryName: data.country || ''
      };
    } else if (context === 'here_suggestion') { // Kontekst dla specyficznej struktury HERE (jeśli jest inna)
      return {
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        name: data.label, // HERE używa 'label'
        countryName: data.countryName
      };
    } else if (context === 'provider_suggestion') { // NOWY KONTEKST dla InternalAddressSuggestionDTO
      return {
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        name: data.fullAddressLabel || data.name, // Użyj fullAddressLabel jako głównego opisu/nazwy
        countryName: data.countryName
      };
    }

    // Fallback, jeśli kontekst nie jest dokładnie dopasowany, ale próbujemy zgadnąć
    if (data.DeliveryStreet || data.PickUpStreet) {
        console.warn(`AddressDisplay: Próba zgadnięcia kontekstu 'delivery' dla: ${jsonString.substring(0,100)}...`);
        return parseAddressDataInternal(jsonString, 'delivery', errorObject);
    } else if (data.street && data.city && data.postalCode && data.fullAddressLabel) { // Heurystyka dla InternalAddressSuggestionDTO
        console.warn(`AddressDisplay: Próba zgadnięcia kontekstu 'provider_suggestion' dla: ${jsonString.substring(0,100)}...`);
        return parseAddressDataInternal(jsonString, 'provider_suggestion', errorObject);
    } else if (data.street && data.city && data.postalCode) { // Heurystyka dla DatabaseAddressDTO
        console.warn(`AddressDisplay: Próba zgadnięcia kontekstu 'database_dto' dla: ${jsonString.substring(0,100)}...`);
        return parseAddressDataInternal(jsonString, 'database_dto', errorObject);
    }

    console.error(`AddressDisplay: Nieznany lub nieobsługiwany kontekst '${context}' w parseAddressDataInternal.`, data);
    errorObject.value = `Nie można zinterpretować danych adresowych dla kontekstu: ${context}.`;
    return data; // Zwróć surowe dane, jeśli nie można zmapować

  } catch (e) {
    console.error(`AddressDisplay: Błąd parsowania JSON dla kontekstu '${context}':`, e, jsonString.substring(0,200));
    errorObject.value = `Niepoprawny format danych adresowych. Szczegóły: ${e.message}`;
    return null;
  }
};

const parsedAddress = computed(() => {
  parsingError.value = null;
  return parseAddressDataInternal(props.addressString, props.addressContext, parsingError);
});

const parsedCompareToAddress = computed(() => {
  if (!props.compareToAddressString) return null;
  const compareContext = (props.addressContext === 'pickup' || props.addressContext === 'delivery')
                           ? 'database_dto'
                           : props.addressContext;
  const tempError = ref(null);
  return parseAddressDataInternal(props.compareToAddressString, compareContext, tempError);
});

const hasAddressData = (addressObject) => {
  if (!addressObject) return false;
  return displayFields.some(field => {
    const value = addressObject[field.key];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
};

const containerClasses = computed(() => {
  switch(props.highlightAsSource) {
    case 'error': return 'bg-red-50 border border-red-200';
    case 'truth': return 'bg-green-50 border border-green-200';
    default: return 'bg-slate-50 border border-slate-200';
  }
});

const titleClasses = computed(() => {
  switch(props.highlightAsSource) {
    case 'error': return 'text-red-700';
    case 'truth': return 'text-green-700';
    default: return 'text-slate-700';
  }
});

const getFieldClass = (fieldKey, fieldValue) => {
  if (props.compareToAddressString && parsedCompareToAddress.value && parsedAddress.value) {
    const compareValue = parsedCompareToAddress.value[fieldKey];
    const originalValue = fieldValue;
    if (normalizeString(originalValue) !== normalizeString(compareValue)) {
      return 'text-red-600 font-semibold bg-red-100 px-1 rounded-sm';
    }
  }
  return 'text-slate-800';
};

watch(() => props.addressString, () => {
  parsingError.value = null;
});
</script>