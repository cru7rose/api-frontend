<template>
  <router-view />
</template>

<script setup>
// Logika specyficzna dla App.vue, jeśli potrzebna,
// ale dla głównego layoutu dashboardu logika będzie w DashboardLayout.vue
</script>

<style>
/* Globalne style są już importowane w main.js poprzez import './style.css'; */
/* Jeśli potrzebujesz tutaj specyficznych stylów tylko dla #app-container lub globalnych styli,
   które nie są w style.css, możesz je tu dodać, ale NIE importuj ponownie './style.css' */
</style>