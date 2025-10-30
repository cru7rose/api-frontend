<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <div class="bg-gradient-to-r from-cyan-700 to-blue-900 text-white p-6 rounded-xl shadow-2xl mb-8">
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold">Ostatnio Dodane Adresy</h1>
        <p class="mt-2 text-blue-200">Historia adresów, które zostały niedawno zweryfikowane i dodane do bazy TrackIT.</p>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
      <p class="text-lg text-slate-500 mt-5">Ładowanie historii adresów...</p>
    </div>

    <div v-else-if="addresses.length === 0" class="text-center py-16 bg-white rounded-xl shadow-md">
      <svg class="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      <h3 class="mt-3 text-lg font-medium text-slate-800">Brak danych</h3>
      <p class="mt-1 text-sm text-slate-500">Nie znaleziono ostatnio dodanych adresów w bazie danych.</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-xl overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alias</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nazwa (Attention Name)</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Adres</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Dodania</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cust ID</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr v-for="(address, index) in addresses" :key="index" class="hover:bg-slate-50">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{{ address.alias }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ address.attentionName }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
              {{ address.street }} {{ address.houseNo }}, {{ address.postalCode }} {{ address.city }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ formatDate(address.createdAt) }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ address.custId }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/Api.js';

const addresses = ref([]);
const isLoading = ref(false);

const fetchRecentAddresses = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get('/tes-api/address-history/recent?limit=100');
    addresses.value = response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania historii adresów:', error);
    addresses.value = [];
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'medium' });
};

onMounted(() => {
  fetchRecentAddresses();
});
</script>