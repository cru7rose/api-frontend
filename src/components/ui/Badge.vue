<template><span :class="['badge', toneClass]"><slot/></span></template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ tone: { default: 'neutral' } })
const toneClass = computed(() => ({ success:'badge-success', warning:'badge-warning', danger:'badge-danger', info:'badge-info', neutral:'badge-neutral' }[props.tone]))
</script>
