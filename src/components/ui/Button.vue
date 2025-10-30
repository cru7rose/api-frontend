<template>
  <button :class="['btn', variantClass, sizeClass, block && 'w-full']" v-bind="$attrs">
    <slot />
  </button>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ variant: { default: 'primary' }, size: { default: 'md' }, block: Boolean })
const variantClass = computed(() => ({ primary:'btn-primary', accent:'btn-accent', ghost:'btn-ghost' }[props.variant] || 'btn-primary'))
const sizeClass = computed(() => ({ sm:'px-3 py-1.5 text-sm rounded-lg', md:'px-4 py-2 text-sm rounded-xl', lg:'px-5 py-3 text-base rounded-2xl' }[props.size]))
</script>
