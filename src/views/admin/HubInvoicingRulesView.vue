<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useInvoicingRulesStore } from '@/stores/invoicingRulesStore';

const rulesStore = useInvoicingRulesStore();

const isModalOpen = ref(false);
const isEditing = ref(false);
const currentRule = reactive({
  id: null,
  hubId: '',
  // --- UZUPEŁNIJ ---
  // Dodaj inne pola z Twojego modelu danych 'rule'
  // np. description: '', amount: 0
});

onMounted(() => {
  rulesStore.fetchHubRules();
});

const openAddModal = () => {
  isEditing.value = false;
  Object.assign(currentRule, { id: null, hubId: '' }); // Reset form
  isModalOpen.value = true;
};

const openEditModal = (rule) => {
  isEditing.value = true;
  Object.assign(currentRule, rule); // Load rule data into form
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
      <h1 class="text-2xl font-bold text-gray-800">HUB Invoicing Rules</h1>
      <button @click="openAddModal" class="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Add New Rule</button>
    </div>

    <div v-if="rulesStore.isLoading">Loading...</div>
    <div v-else-if="rulesStore.error" class="text-red-600">{{ rulesStore.error }}</div>
    
    <table v-else class="min-w-full bg-white">
      <thead class="bg-gray-200">
        <tr>
          <th class="py-2 px-4 text-left">HUB ID</th>
          <th class="py-2 px-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rule in rulesStore.sortedHubRules" :key="rule.id" class="border-b">
          <td class="py-2 px-4">{{ rule.hubId }}</td>
          <td class="py-2 px-4 space-x-2">
            <button @click="openEditModal(rule)" class="text-blue-600 hover:underline">Edit</button>
            <button @click="handleDelete(rule.id)" class="text-red-600 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">{{ isEditing ? 'Edit' : 'Add' }} Rule</h2>
            <form @submit.prevent="handleSave" class="space-y-4">
                <div>
                    <label for="hubId" class="block text-sm font-medium">HUB ID</label>
                    <input type="text" id="hubId" v-model="currentRule.hubId" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg">{{ rulesStore.isLoading ? 'Saving...' : 'Save' }}</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>