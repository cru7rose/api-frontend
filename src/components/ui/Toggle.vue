<template>
  <button :aria-pressed="modelValue" :class="['toggle', modelValue && 'toggle-on']" @click="$emit('update:modelValue',!modelValue)">
    <span class="toggle-dot absolute"></span>
  </button>
</template>
<script setup>defineProps({ modelValue:Boolean })</script>
