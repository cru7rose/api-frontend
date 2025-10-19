<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <form class="w-full max-w-sm space-y-4" @submit.prevent="submit">
      <h1 class="text-2xl font-semibold">Sign in</h1>
      <div>
        <label class="block text-sm mb-1">Username</label>
        <input v-model="username" class="w-full border rounded p-2" autocomplete="username" />
      </div>
      <div>
        <label class="block text-sm mb-1">Password</label>
        <input v-model="password" type="password" class="w-full border rounded p-2" autocomplete="current-password" />
      </div>
      <button class="w-full rounded p-2 border hover:bg-gray-50" :disabled="busy">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useRoute } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref('admin');
const password = ref('pass');
const busy = ref(false);
const error = ref('');

const submit = async () => {
  error.value = '';
  busy.value = true;
  try {
    await auth.login({ username: username.value, password: password.value });
    const redirect = route.query.r || '/dashboard';
    router.push(String(redirect));
  } catch (e) {
    error.value = e?.message || 'Login failed';
  } finally {
    busy.value = false;
  }
};
</script>
