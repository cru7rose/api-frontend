<template>
  <div class="bg-white p-6 rounded-xl shadow-lg">
    <h2 class="text-xl font-bold text-slate-800 mb-4">Eksport Statusów Zamówień</h2>
    <p class="text-sm text-slate-600 mb-4">
      Pliki ze statusami generowane są automatycznie co 15 minut. Kliknij przycisk poniżej, aby pobrać ostatnio wygenerowany plik.
    </p>
    <div v-if="lastFileInfo.fileName" class="text-xs text-gray-500 mb-4">
      Ostatni plik: <span class="font-mono bg-gray-200 p-1 rounded">{{ lastFileInfo.fileName }}</span>
    </div>

    <button @click="downloadFile" :disabled="isLoading" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center disabled:opacity-50">
      <svg v-if="!isLoading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
      <svg v-else class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {{ isLoading ? 'Pobieranie...' : 'Pobierz Plik ze Statusami' }}
    </button>
    <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '@/services/Api.js';

const isLoading = ref(false);
const errorMessage = ref('');
const lastFileInfo = ref({ fileName: null, content: '' });

const downloadFile = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiClient.get('/api/status-export/latest');
    const { fileName, content } = response.data;
    
    lastFileInfo.value = { fileName, content };

    if (!content || content.includes("Brak wygenerowanych statusów")) {
        errorMessage.value = "Brak dostępnych plików do pobrania. Poczekaj na następny cykl generowania.";
        return;
    }

    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Błąd podczas pobierania pliku statusów:', error);
    errorMessage.value = 'Nie udało się pobrać pliku. Sprawdź konsolę, aby uzyskać więcej informacji.';
  } finally {
    isLoading.value = false;
  }
};
</script>