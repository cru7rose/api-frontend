<template>
  <div class="min-h-screen bg-gradient-to-tr from-[#121212] via-[#1e1e1e] to-[#000000] text-white">
    <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-white">Danxils<span class="text-green-500">.js</span></h1>
        <button @click="toggleDarkMode" class="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md">Toggle Theme</button>
      </div>

      <div class="text-center z-10">
        <h2 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          <span class="text-white">Zanurz się w</span>
          <span class="block bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">Nowoczesny Panel</span>
        </h2>
        <p class="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Zarządzaj błędami, kontroluj adresy, przetwarzaj dane i optymalizuj wszystko w czasie rzeczywistym. Z estetyką, która inspiruje.
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <router-link to="/dashboard" class="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-black bg-green-400 hover:bg-green-300 rounded-full shadow-xl transition-all">Wejdź do Panelu</router-link>
          <router-link to="/login" class="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white border border-white hover:bg-white hover:text-black rounded-full transition-all">Zaloguj się</router-link>
        </div>
      </div>

      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute -top-20 left-1/3 w-[600px] h-[600px] bg-green-600 rounded-full blur-[150px] opacity-30 animate-blob"></div>
        <div class="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[150px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const darkMode = ref(false)
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}
</script>

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 15s infinite ease-in-out;
}
.animation-delay-2000 {
  animation-delay: -7s;
}
</style>
