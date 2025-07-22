<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 class="text-3xl font-bold text-center text-indigo-600 mb-8">Zmień Hasło</h2>
      <form @submit.prevent="handleChangePassword">
        <div v-if="message" :class="messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="mb-4 p-3 rounded text-sm">
          {{ message }}
        </div>

        <div class="mb-6">
          <label for="oldPassword" class="block text-sm font-medium text-gray-700 mb-1">Stare Hasło</label>
          <input
            type="password"
            id="oldPassword"
            v-model="oldPassword"
            required
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="••••••••"
          />
        </div>

        <div class="mb-6">
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">Nowe Hasło</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            required
            minlength="8"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Minimum 8 znaków"
          />
        </div>

        <div class="mb-6">
          <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 mb-1">Potwierdź Nowe Hasło</label>
          <input
            type="password"
            id="confirmNewPassword"
            v-model="confirmNewPassword"
            required
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="••••••••"
          />
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="isLoading" class="animate-spin mr-2">⏳</span>
            Zmień Hasło
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const oldPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);
const message = ref('');
const messageType = ref('');

const handleChangePassword = async () => {
  message.value = '';
  messageType.value = '';

  if (newPassword.value !== confirmNewPassword.value) {
    message.value = 'Nowe hasła nie są identyczne.';
    messageType.value = 'error';
    return;
  }

  if (newPassword.value.length < 8) {
    message.value = 'Nowe hasło musi mieć co najmniej 8 znaków.';
    messageType.value = 'error';
    return;
  }

  isLoading.value = true;
  try {
    await authStore.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value
    });
    message.value = 'Hasło zostało pomyślnie zmienione. Zostaniesz wylogowany.';
    messageType.value = 'success';
    oldPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
    setTimeout(() => {
      authStore.logout();
      router.push('/login');
    }, 3000);
  } catch (error) {
    message.value = error.message || 'Nie udało się zmienić hasła. Spróbuj ponownie.';
    messageType.value = 'error';
    console.error('Change password failed:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>