<template>
  <div class="kpi">
    <div class="kpi-icon">{{ icon }}</div>
    <div>
      <div class="text-xs uppercase tracking-wide text-slate-500">{{ label }}</div>
      <div class="text-2xl font-semibold text-slate-900">{{ value }}</div>
    </div>
  </div>
</template>
<script setup>defineProps({ icon:{default:'★'}, label:String, value:String })</script>
