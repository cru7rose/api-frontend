<template>
  <header
      class="h-14 flex items-center justify-between border-b border-slate-200 bg-white px-4"
  >
    <!-- LEFT: page title (slot or prop) -->
    <div class="flex items-center gap-2">
      <slot name="title">
        <h1 class="text-lg font-semibold text-slate-800 tracking-wide">
          DANXILS
        </h1>
      </slot>
    </div>

    <!-- RIGHT: User menu -->
    <div class="flex items-center gap-4">
      <!-- Username (if passed) -->
      <span
          v-if="username"
          class="text-slate-700 text-sm font-medium"
      >{{ username }}</span>

      <!-- Logout button -->
      <button @click="emitLogout" class="btn-blue text-sm">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  username: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['logout'])

function emitLogout() {
  emit('logout')
}
</script>

<style scoped>
/* matches your theme buttons */
.btn-blue {
  padding: 0.35rem 0.9rem;
  border-radius: 0.375rem;
  font-weight: 500;
  color: white;
  background: var(--brand-blue, #1e4ed8);
  transition: background 0.15s ease;
}

.btn-blue:hover {
  background: #274ee6;
}
</style>
