<template><div class="progress"><div class="progress-inner" :style="{ width: pct + '%' }"></div></div></template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ value: { type:Number, default:0 } })
const pct = computed(()=> Math.max(0, Math.min(100, props.value)))
</script>
