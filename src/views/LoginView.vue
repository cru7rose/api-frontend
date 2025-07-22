<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 class="text-3xl font-bold text-center text-indigo-600 mb-8">Logowanie</h2>
      <form @submit.prevent="handleLogin">
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          {{ errorMessage }}
        </div>
        <div class="mb-6">
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Nazwa użytkownika</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="username"
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="••••••••"
          />
        </div>
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-lg text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
          >
            <span v-if="isLoading" class="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            Zaloguj
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';

const username = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await authStore.login({ username: username.value, password: password.value })
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Logowanie nie powiodło się. Sprawdź dane lub spróbuj później.'
    console.error('Login failed:', error)
  } finally {
    isLoading.value = false
  }
}
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