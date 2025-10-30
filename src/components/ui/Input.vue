<template>
  <div class="space-y-1">
    <label v-if="label" class="text-sm text-slate-600">{{ label }}</label>
    <input class="input" v-bind="$attrs" :value="modelValue" @input="$emit('update:modelValue',$event.target.value)" />
    <p v-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
<script setup>defineProps({ modelValue:String, label:String, hint:String })</script>
