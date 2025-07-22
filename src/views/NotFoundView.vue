<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
    <div class="bg-white p-8 sm:p-12 rounded-xl shadow-2xl max-w-md w-full">
      <svg class="w-24 h-24 text-indigo-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h1 class="text-5xl font-extrabold text-indigo-600 mb-3">404</h1>
      <p class="text-xl font-medium text-slate-700 mb-6">Oops! Strona nie została znaleziona.</p>
      <p class="text-slate-500 mb-8">
        Strona, której szukasz, mogła zostać usunięta, jej nazwa uległa zmianie lub jest tymczasowo niedostępna.
      </p>
      <router-link
        to="/"
        class="inline-block px-8 py-3 text-sm font-semibold leading-tight text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        Wróć na Stronę Główną
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>