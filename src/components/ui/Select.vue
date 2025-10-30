<template>
  <div class="space-y-1">
    <label v-if="label" class="text-sm text-slate-600">{{ label }}</label>
    <select class="select" v-bind="$attrs" :value="modelValue" @change="$emit('update:modelValue',$event.target.value)"><slot/></select>
  </div>
</template>
<script setup>defineProps({ modelValue:[String,Number], label:String })</script>
