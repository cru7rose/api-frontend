<script setup>
import { ref, onMounted } from 'vue';
// Zakładamy, że masz lub stworzysz store do obsługi błędów
// na podstawie pliku stores/errorStore.js
// Jeśli twój store nazywa się inaczej, zaktualizuj import.
import apiService from '@/stores/errorStore'; 

const errors = ref([]);
const isLoading = ref(false);
const error = ref(null);

const fetchErrors = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Użycie metody z Twojego serwisu API
    const response = await apiService.getProcessingErrors();
    errors.value = response.data;
  } catch (err) {
    console.error('Failed to fetch processing errors:', err);
    error.value = 'Could not load processing errors. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

// Pobierz dane, gdy komponent zostanie załadowany
onMounted(fetchErrors);
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Processing Errors</h1>

    <div v-if="isLoading" class="text-center text-gray-500">
      <p>Loading errors...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
      <strong class="font-bold">Error: </strong>
      <span>{{ error }}</span>
    </div>

    <table v-else-if="errors.length > 0" class="min-w-full bg-white">
      <thead class="bg-gray-200">
        <tr>
          <th class="py-2 px-4 text-left">Error ID</th>
          <th class="py-2 px-4 text-left">Message</th>
          <th class="py-2 px-4 text-left">Timestamp</th>
          <th class="py-2 px-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in errors" :key="item.id" class="border-b hover:bg-gray-50">
          <td class="py-2 px-4 font-mono text-sm">{{ item.id }}</td>
          <td class="py-2 px-4">{{ item.message }}</td>
          <td class="py-2 px-4">{{ new Date(item.timestamp).toLocaleString() }}</td>
          <td class="py-2 px-4">
            <button class="text-blue-600 hover:underline">Details</button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else class="text-center text-gray-500">
        <p>No processing errors found. Great job! ✅</p>
    </div>

  </div>
</template>