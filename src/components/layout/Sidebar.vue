<template>
  <aside class="sidebar hidden lg:block">
    <nav class="space-y-2">
      <a v-for="item in items" :key="item.label" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50" href="#" @click.prevent="$emit('navigate', item.key)">
        <span class="w-8 h-8 rounded-xl bg-brand"></span>
        <span class="text-sm font-medium">{{ item.label }}</span>
      </a>
    </nav>
  </aside>
</template>
<script setup>
defineProps({ items: { type:Array, default:()=>[{key:'dashboard',label:'Dashboard'},{key:'worklist',label:'Worklist'},{key:'style',label:'Style Guide'}] } })
</script>
