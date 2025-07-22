<template>
  <div class="bg-white p-8 rounded-lg shadow-md">
    <h1 v-if="authStore.user" class="text-3xl font-bold text-gray-800 mb-4">
      Witaj na Dashboardzie, {{ authStore.user.username }}!
    </h1>
    <p class="text-gray-600">To jest chroniona zawartość.</p>
    <p class="mt-4">Twój Access Token (fragment): <code class="bg-gray-200 p-1 rounded text-sm">{{ shortAccessToken }}</code></p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore()

const shortAccessToken = computed(() => {
  if (authStore.accessToken) {
    return authStore.accessToken.substring(0, 20) + '...'
  }
  return 'Brak tokenu'
})
</script>