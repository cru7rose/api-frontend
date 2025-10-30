<template>
  <div class="card p-5">
    <div v-if="title" class="mb-3 flex items-center justify-between">
      <h3 class="font-semibold text-slate-900">{{ title }}</h3>
      <slot name="action"/>
    </div>
    <slot/>
  </div>
</template>
<script setup>defineProps({ title:String })</script>
