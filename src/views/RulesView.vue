<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useInvoicingRulesStore } from '@/stores/invoicingRulesStore';

const rulesStore = useInvoicingRulesStore();

// Sterowanie modalem do dodawania/edycji
const isModalOpen = ref(false);
const isEditing = ref(false);
// Reaktywny obiekt przechowujący dane reguły z formularza
const currentRule = reactive({
  id: null,
  hubId: '',
  // Możesz tu dodać więcej pól, jeśli Twój model 'rule' ich wymaga
});

// Pobierz reguły po załadowaniu komponentu
onMounted(() => {
  rulesStore.fetchHubRules();
});

const openAddModal = () => {
  isEditing.value = false;
  // Resetuj formularz przed otwarciem
  Object.assign(currentRule, { id: null, hubId: '' });
  isModalOpen.value = true;
};

const openEditModal = (rule) => {
  isEditing.value = true;
  // Wczytaj dane istniejącej reguły do formularza
  Object.assign(currentRule, rule);
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleSave = async () => {
  await rulesStore.saveRule({ ...currentRule });
  closeModal();
};

const handleDelete = async (ruleId) => {
  if (confirm('Are you sure you want to delete this rule?')) {
    await rulesStore.deleteRule(ruleId);
  }
};
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Invoicing Rules Management</h1>
      <button @click="openAddModal" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Add New Rule
      </button>
    </div>

    <div v-if="rulesStore.isLoading" class="text-center p-4">Loading rules...</div>
    <div v-else-if="rulesStore.error" class="text-red-600 bg-red-100 p-4 rounded-md">{{ rulesStore.error }}</div>

    <table v-else-if="rulesStore.sortedHubRules.length" class="min-w-full bg-white">
      <thead class="bg-gray-100">
        <tr>
          <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HUB ID</th>
          <th class="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="rule in rulesStore.sortedHubRules" :key="rule.id" class="hover:bg-gray-50">
          <td class="py-4 px-4 whitespace-nowrap font-medium text-gray-900">{{ rule.hubId }}</td>
          <td class="py-4 px-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
            <button @click="openEditModal(rule)" class="text-indigo-600 hover:text-indigo-900">Edit</button>
            <button @click="handleDelete(rule.id)" class="text-red-600 hover:text-red-900">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center text-gray-500 p-4">No rules found. Click "Add New Rule" to get started.</div>
  </div>

  <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 class="text-xl font-bold mb-6">{{ isEditing ? 'Edit Rule' : 'Add a New Rule' }}</h2>
          <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                  <label for="hubId" class="block text-sm font-medium text-gray-700">HUB ID</label>
                  <input type="text" id="hubId" v-model="currentRule.hubId" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                  <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                  <button type="submit" :disabled="rulesStore.isLoading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                    {{ rulesStore.isLoading ? 'Saving...' : 'Save' }}
                  </button>
              </div>
          </form>
      </div>
  </div>
</template>