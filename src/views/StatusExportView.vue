<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">Eksport Statusów</h1>
        <p class="mt-2 text-sm text-gray-700">
          Przeglądaj i pobieraj historyczne pliki JSON ze statusami wysłanymi do systemu AED.
        </p>
      </div>
    </div>
    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nazwa Pliku</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Data Utworzenia</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="isLoadingFiles">
                  <td colspan="3" class="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">Ładowanie listy plików...</td>
                </tr>
                <tr v-else-if="files.length === 0">
                  <td colspan="3" class="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">Nie znaleziono wygenerowanych plików.</td>
                </tr>
                <tr v-for="file in files" :key="file.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ file.fileName }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ new Date(file.createdAt).toLocaleString() }}</td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button @click="previewFile(file)" class="text-indigo-600 hover:text-indigo-900">Podgląd</button>
                    <button @click="downloadFile(file)" class="ml-4 text-indigo-600 hover:text-indigo-900">Pobierz</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedFileContent" class="mt-8">
      <h2 class="text-lg font-medium text-gray-900">Podgląd pliku: {{ selectedFileName }}</h2>
      <div class="mt-2 bg-gray-800 text-white p-4 rounded-lg shadow-inner overflow-x-auto">
        <pre class="text-sm">{{ selectedFileContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api'; // Upewnij się, że ścieżka jest poprawna

// === STAN KOMPONENTU ===
const files = ref([]);
const isLoadingFiles = ref(false);
const selectedFileName = ref('');
const selectedFileContent = ref('');

// === METODY ===

/**
 * Pobiera listę wygenerowanych plików z backendu.
 */
const fetchFiles = async () => {
  isLoadingFiles.value = true;
  selectedFileContent.value = ''; // Resetuj podgląd przy odświeżaniu
  try {
    const response = await apiClient.get('/api/status-export/files');
    // Zakładamy, że API zwraca obiekt z polem `content`
    files.value = response.data.content || [];
  } catch (error) {
    console.error('Błąd podczas pobierania listy plików:', error);
    files.value = []; // Wyczyść listę w razie błędu
  } finally {
    isLoadingFiles.value = false;
  }
};

/**
 * Pobiera zawartość pliku i wyświetla ją w sekcji podglądu.
 * @param {object} file - Obiekt pliku z listy (musi zawierać `id` i `fileName`).
 */
const previewFile = async (file) => {
  selectedFileName.value = `Ładowanie podglądu dla: ${file.fileName}...`;
  selectedFileContent.value = 'Proszę czekać...';
  try {
    const response = await apiClient.get(`/api/status-export/files/${file.id}/download`);
    
    // Axios automatycznie parsuje odpowiedź JSON na obiekt JavaScript.
    const jsonObject = response.data;
    
    // KLUCZOWA POPRAWKA:
    // Konwertujemy otrzymany OBIEKT z powrotem na SFORMATOWANY TEKST JSON.
    // Argumenty `null, 2` zapewniają czytelne wcięcia.
    selectedFileContent.value = JSON.stringify(jsonObject, null, 2);
    selectedFileName.value = file.fileName;

  } catch (error) {
    console.error(`Błąd podczas pobierania podglądu pliku ${file.id}:`, error);
    selectedFileName.value = `Błąd ładowania pliku: ${file.fileName}`;
    selectedFileContent.value = 'Nie udało się załadować zawartości pliku. Sprawdź konsolę, aby uzyskać więcej informacji.';
  }
};

/**
 * Pobiera zawartość pliku i inicjuje jego pobranie przez przeglądarkę.
 * @param {object} file - Obiekt pliku z listy (musi zawierać `id` i `fileName`).
 */
const downloadFile = async (file) => {
  try {
    const response = await apiClient.get(`/api/status-export/files/${file.id}/download`);

    const jsonObject = response.data;

    // KLUCZOWA POPRAWKA (taka sama jak w podglądzie):
    const jsonText = JSON.stringify(jsonObject, null, 2);

    // Tworzymy Blob (binarny obiekt) z tekstu JSON
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8;' });
    
    // Tworzymy tymczasowy link do pobrania pliku
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', file.fileName);
    link.style.visibility = 'hidden';
    
    // Dodajemy link do dokumentu, klikamy go i usuwamy
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Zwalniamy zasoby
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error(`Błąd podczas pobierania pliku ${file.id}:`, error);
    alert('Nie udało się pobrać pliku. Sprawdź konsolę, aby uzyskać więcej informacji.');
  }
};

// === CYKL ŻYCIA KOMPONENTU ===

// Pobierz listę plików, gdy komponent zostanie zamontowany
onMounted(() => {
  fetchFiles();
});
</script>