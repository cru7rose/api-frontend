<template>
  <header class="navbar">
    <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-brand"></div>
        <div class="font-semibold">Yellow–Blue UI</div>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="accent">Accent</Button>
      </div>
    </div>
  </header>
</template>
<script setup>
import Button from '@/components/ui/Button.vue'
</script>
