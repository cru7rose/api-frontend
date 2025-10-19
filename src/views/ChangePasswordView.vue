<script setup>
import { ref } from 'vue';

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const message = ref('');
const error = ref('');

const handleChangePassword = () => {
  // Reset messages
  message.value = '';
  error.value = '';

  if (newPassword.value !== confirmPassword.value) {
    error.value = "New passwords do not match.";
    return;
  }

  // --- UZUPEŁNIJ ---
  // Tutaj należy dodać wywołanie do API w celu zmiany hasła.
  // Prawdopodobnie trzeba będzie stworzyć nową akcję w `authStore`
  // lub dedykowanym `userStore`.
  console.log('Changing password for:', {
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
  });

  // Po pomyślnym wywołaniu API
  message.value = "Password changed successfully!";
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
};
</script>

<template>
    <div class="bg-white p-6 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">Change Password</h1>
        <form @submit.prevent="handleChangePassword" class="space-y-4 max-w-lg">
            <div>
                <label for="oldPassword" class="block text-sm font-medium text-gray-700">Old Password</label>
                <input type="password" id="oldPassword" v-model="oldPassword" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
            </div>
            <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" id="newPassword" v-model="newPassword" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
            </div>
            <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type="password" id="confirmPassword" v-model="confirmPassword" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
            </div>
            
            <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
            <div v-if="message" class="text-green-600 text-sm">{{ message }}</div>

            <div>
                <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Update Password
                </button>
            </div>
        </form>
    </div>
</template>