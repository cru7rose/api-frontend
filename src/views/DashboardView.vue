<script setup>
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-4">Welcome, {{ authStore.username }}!</h1>
    <p class="text-gray-600">This is your main dashboard. Select an option from the sidebar to get started.</p>
  </div>
</template>