<template>
  <div>
    <div class="flex gap-2 mb-4">
      <button v-for="t in tabs" :key="t" :class="['tab', modelValue===t && 'tab-active']" @click="$emit('update:modelValue', t)">{{ t }}</button>
    </div>
    <slot :active="modelValue"/>
  </div>
</template>
<script setup>defineProps({ modelValue:String, tabs:{ type:Array, default:()=>[] } })</script>
