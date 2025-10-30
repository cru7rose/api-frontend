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
                  id="username" name="username" type="text" required v-model="credentials.username"
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400
                       focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
            <div class="mt-2">
              <input
                  id="password" name="password" type="password" required v-model="credentials.password"
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400
                       focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <button
              type="submit"
              class="w-full flex justify-center py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Sign in
          </button>

          <p v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import apiClient from '@/services/Api.js';

const credentials = reactive({ username: '', password: '' });
const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  try {
    await apiClient.post('/api/auth/login', credentials);
    // Router guard should redirect after auth binds token
    window.location.assign('/worklist');
  } catch (e) {
    errorMessage.value = 'Login failed';
  }
};
</script>
