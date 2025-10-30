<template>
  <aside
      class="h-full w-64 shrink-0 border-r border-slate-200 bg-white"
      :class="[{ 'w-20': collapsed }]"
  >
    <!-- Brand -->
    <div class="flex items-center gap-2 px-4 h-14 border-b border-slate-200">
      <div class="h-8 w-8 rounded-xl brand-grad"></div>
      <strong v-if="!collapsed" class="tracking-wide text-slate-900">DANXILS</strong>
    </div>

    <!-- Nav -->
    <nav class="py-3">
      <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          :class="isActive(item.to) ? 'bg-slate-50 border-r-4 border-r-[var(--brand-blue)] text-slate-900' : ''"
      >
        <component :is="item.icon" class="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- Actions -->
    <div class="mt-auto p-3">
      <button class="btn-blue w-full" @click="$emit('toggle')">
        {{ collapsed ? 'Expand' : 'Collapse' }}
      </button>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { h, ref } from 'vue'

// simple lucide-like icons (inline)
const IconList = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
  h('path', { d: 'M8 6h13M8 12h13M8 18h13' }),
  h('path', { d: 'M3 6h.01M3 12h.01M3 18h.01' })
])
const IconMapPin = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
  h('path', { d: 'M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z' }),
  h('circle', { cx: '12', cy: '11', r: '2' })
])
const IconLog = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
  h('rect', { x: '3', y: '4', width: '14', height: '16', rx: '2' }),
  h('path', { d: 'M7 8h6M7 12h6M7 16h4' }),
  h('path', { d: 'M17 7v10l4 3V4l-4 3z' })
])

const collapsed = ref(false)
defineEmits(['toggle'])
const route = useRoute()
const isActive = (to) => route.path === to

// Adjust these to your router:
const items = [
  { to: '/worklist', label: 'Worklist', icon: IconList },
  { to: '/editor/1', label: 'Editor (sample)', icon: IconMapPin },
  { to: '/logs', label: 'Logs', icon: IconLog },
  { to: '/style-showcase', label: 'Style', icon: IconLog }
]
</script>

<style scoped>
.brand-grad { background: linear-gradient(135deg, var(--brand-yellow) 0%, var(--brand-blue) 100%); }
</style>
