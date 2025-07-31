<template>
    <div :class="{ 'opacity-50 pointer-events-none': disabled }">
        <h4 class="font-semibold text-md text-slate-700 mb-2 flex items-center">
            {{ title }}
            <span v-if="disabled" class="ml-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Adres Istnieje w Bazie
            </span>
        </h4>
        <div class="bg-white p-4 border border-slate-200 rounded-lg space-y-3">
            
            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Nazwa Miejsca / Firmy (wyszukaj):</label>
                <input type="text" v-model="placeSearchQuery" @input="debouncedNameSearch"
                       placeholder="np. Stadion Narodowy, Galeria Młociny..."
                       :disabled="disabled"
                       class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
            </div>

            <div class="border-t border-slate-200 my-3"></div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Alias:</label>
                <input type="text" :value="addressData.alias" @input="updateField('alias', $event.target.value)"
                       :disabled="disabled"
                       class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Ulica:</label>
                <input type="text" :value="addressData.street" @input="onInput('street', $event.target.value)"
                       :disabled="disabled"
                       class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Nr domu:</label>
                    <input type="text" :value="addressData.houseNo" @input="onInput('houseNo', $event.target.value)"
                           :disabled="disabled"
                           class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Kod pocztowy:</label>
                    <input type="text" :value="addressData.postalCode" @input="onInput('postalCode', $event.target.value)"
                           :disabled="disabled"
                           class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Miasto:</label>
                    <input type="text" :value="addressData.city" @input="onInput('city', $event.target.value)"
                           :disabled="disabled"
                           class="p-2 w-full border border-slate-300 rounded-md shadow-sm text-sm disabled:bg-slate-100" />
                </div>
            </div>
            <div v-if="isLoadingSuggestions" class="text-center text-sm text-slate-500 pt-2 flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                <span>Szukanie sugestii...</span>
            </div>
            <div v-if="suggestions.length > 0" class="border-t pt-2 mt-2">
                 <ul class="border border-slate-200 rounded-lg bg-white max-h-32 overflow-y-auto">
                    <li v-for="(suggestion, index) in suggestions" :key="index" @click="selectDynamicSuggestion(suggestion)"
                        class="p-2 border-b last:border-b-0 text-xs text-slate-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                        {{ suggestion.fullAddressLabel }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { fetchOnDemandSuggestions, fetchByNameSearch } from '@/services/addressSuggestionService.js';

const props = defineProps({
    title: String,
    addressData: Object,
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update']);

const suggestions = ref([]);
const isLoadingSuggestions = ref(false);
const placeSearchQuery = ref('');
let debounceTimer = null;

const updateField = (field, value) => {
    emit('update', { ...props.addressData, [field]: value });
};

const onInput = (field, value) => {
    updateField(field, value);
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        getDynamicSuggestionsByAddress();
    }, 600);
};

const getDynamicSuggestionsByAddress = async () => {
    const query = {
        street: props.addressData.street,
        houseNumber: props.addressData.houseNo,
        postalCode: props.addressData.postalCode,
        city: props.addressData.city,
        country: 'Polska'
    };
    if (Object.values(query).every(v => !v || v.trim() === '')) {
        suggestions.value = [];
        return;
    }
    isLoadingSuggestions.value = true;
    suggestions.value = await fetchOnDemandSuggestions(query);
    isLoadingSuggestions.value = false;
};

const getDynamicSuggestionsByName = async () => {
    isLoadingSuggestions.value = true;
    suggestions.value = await fetchByNameSearch(placeSearchQuery.value);
    isLoadingSuggestions.value = false;
};

const debouncedNameSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(getDynamicSuggestionsByName, 600);
};

const selectDynamicSuggestion = (suggestion) => {
    emit('update', {
        ...props.addressData,
        street: suggestion.street || '',
        houseNo: suggestion.houseNumber || '',
        postalCode: suggestion.postalCode || '',
        city: suggestion.city || '',
    });
    suggestions.value = [];
    placeSearchQuery.value = suggestion.fullAddressLabel;
};
</script>
