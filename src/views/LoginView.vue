<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="text-center text-3xl font-extrabold text-blue-700 tracking-tight">
        DANXILS Triage Workbench
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white px-6 py-12 shadow-2xl rounded-xl ring-1 ring-gray-100">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Username</label>
            <div class="mt-2">
              <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  v-model="credentials.username"
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
            </div>
            <div class="mt-2">
              <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  v-model="credentials.password"
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div v-if="authStore.authError" class="text-sm text-red-600 font-medium">
            Error: {{ authStore.authError }}
          </div>

          <div>
            <button
                type="submit"
                :disabled="loading"
                class="w-full button button-primary"
            >
              <span v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-white border-opacity-20 border-t-white"></span>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const credentials = ref({
  username: 'admin',
  password: 'admin',
});
const handleLogin = async () => {
  loading.value = true;
  const success = await authStore.login(credentials.value.username, credentials.value.password);
  loading.value = false;
  if (success) {
    // Navigate to the intended path or default
    router.push(authStore.popRedirect());
  }
};
</script>