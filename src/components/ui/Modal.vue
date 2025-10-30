<template>
  <teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-slate-900">{{ title }}</h3>
          <button class="btn btn-ghost px-2 py-1" @click="$emit('close')">✕</button>
        </div>
        <slot/>
        <div class="mt-5 flex justify-end gap-2">
          <slot name="footer"/>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup>defineProps({ open:Boolean, title:String })</script>
