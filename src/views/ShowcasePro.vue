<template>
  <div class="min-h-screen">
    <Navbar/>
    <div class="mx-auto max-w-7xl px-4 py-8 lg:pl-72">
      <Sidebar class="hidden lg:block" />
      <section class="card p-8 mb-8">
        <h1 class="text-3xl md:text-4xl font-bold leading-tight">
          The <span class="text-grad">Yellow–Blue</span> Interface System
        </h1>
        <p class="mt-2 text-slate-600">A polished, friendly, and fast UI built on a white canvas with vibrant blue + yellow highlights.</p>
        <div class="mt-5 flex gap-3">
          <Button>Get Started</Button>
          <Button variant="accent" @click="open = true">Open Modal</Button>
        </div>
      </section>

      <section class="grid gap-5 md:grid-cols-3 mb-8">
        <KpiTile icon="⏳" label="Pending" :value="kpi.pendingText()" />
        <KpiTile icon="✅" label="Clearance" :value="kpi.clearanceText()" />
        <KpiTile icon="🕒" label="Avg. Resolve" :value="kpi.avgResolutionText()" />
      </section>

      <section class="grid gap-5 md:grid-cols-3 mb-8">
        <Card title="Buttons">
          <div class="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="lg">Large</Button>
            <Button size="sm">Small</Button>
          </div>
        </Card>

        <Card title="Form Inputs">
          <div class="space-y-3">
            <Input v-model="form.name" label="Name" hint="Your display name" placeholder="Jane Doe" />
            <Select v-model="form.city" label="City">
              <option value="Warsaw">Warsaw</option>
              <option value="Kraków">Kraków</option>
              <option value="Gdańsk">Gdańsk</option>
            </Select>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Email Notifications</span>
              <Toggle v-model="form.notify" />
            </div>
          </div>
        </Card>

        <Card title="Progress & Tabs">
          <div class="space-y-4">
            <div class="progress"><div class="progress-inner" :style="{ width: progress.percent + '%' }"></div></div>
            <div class="text-sm text-slate-600">{{ progress.percent }}% complete</div>
            <Tabs v-model="activeTab" :tabs="['Overview','Details','History']">
              <template #default="{ active }">
                <div class="text-sm text-slate-700" v-if="active==='Overview'">Fast overview of the latest actions.</div>
                <div class="text-sm text-slate-700" v-else-if="active==='Details'">Dive into the nitty gritty details.</div>
                <div class="text-sm text-slate-700" v-else>All system events are logged here.</div>
              </template>
            </Tabs>
          </div>
        </Card>
      </section>

      <section class="mb-8">
        <Card title="Statuses">
          <div class="flex flex-wrap gap-2">
            <Badge v-for="s in statusKeys" :key="s" :tone="toneFor(s)">{{ labelFor(s) }}</Badge>
          </div>
        </Card>
      </section>

      <section class="mb-12">
        <Card title="Worklist (Sortable)">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th><button class="underline" @click="sortBy('id')">Order</button></th>
                  <th><button class="underline" @click="sortBy('city')">City</button></th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sortedRows" :key="row.id">
                  <td class="font-medium text-slate-900">{{ row.id.slice(0,8) }}</td>
                  <td>{{ row.city }}</td>
                  <td><Badge :tone="toneFor(row.status)">{{ labelFor(row.status) }}</Badge></td>
                  <td>
                    <div class="flex gap-2">
                      <Button size="sm">Open</Button>
                      <Button size="sm" variant="ghost">Approve</Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Modal :open="open" title="Quick Action" @close="open=false">
        <p class="text-slate-700">This modal follows the yellow–blue theme with a soft glass card.</p>
        <template #footer>
          <Button variant="ghost" @click="open=false">Cancel</Button>
          <Button @click="open=false">Confirm</Button>
        </template>
      </Modal>

      <section class="card p-8 mb-24 flex items-center justify-between flex-col sm:flex-row gap-5">
        <div>
          <h3 class="text-xl font-semibold">Want this theme everywhere?</h3>
          <p class="text-slate-600">Apply tokens + components across routes for instant cohesion.</p>
        </div>
        <div class="flex gap-3">
          <Button>Apply Theme</Button>
          <Button variant="accent" @click="toast('Saved!', 'success')">Toast</Button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/layout/Navbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Toggle from '@/components/ui/Toggle.vue'
import Tabs from '@/components/ui/Tabs.vue'
import Modal from '@/components/ui/Modal.vue'
import KpiTile from '@/components/ui/KpiTile.vue'

import { KpiViewModel } from '@/viewmodels/KpiViewModel'
import { VerificationProgressViewModel } from '@/viewmodels/VerificationProgressViewModel'
import { StatusBadgeViewModel } from '@/viewmodels/StatusBadgeViewModel'
import { useToast } from '@/composables/useToast'

const { success, info, error } = useToast()
const toast = (msg, type='success') => ({ success:()=>success(msg), info:()=>info(msg), error:()=>error(msg) }[type]())

const kpi = new KpiViewModel({ pending: 42, clearancePercent: 87.2, avgMinutes: 96 })
const progressVM = new VerificationProgressViewModel()
const progress = progressVM.snapshot()
const statusKeys = Object.keys(new StatusBadgeViewModel('INGESTED').map)
const labelFor = (code) => new StatusBadgeViewModel(code).toObject().label
const toneFor = (code) => ({
  success:'success', warning:'warning', danger:'danger', info:'info', neutral:'neutral'
})[new StatusBadgeViewModel(code).toObject().tone] || 'neutral'

import { reactive, ref, computed } from 'vue'
const form = reactive({ name:'', city:'Warsaw', notify:true })
const activeTab = ref('Overview')
const open = ref(false)

const rows = ref([
  { id: 'a1b2c3d4-1', city: 'Warsaw', status: 'PENDING_VERIFICATION' },
  { id: 'a1b2c3d4-2', city: 'Kraków', status: 'HAPPY_PATH_MATCHED' },
  { id: 'a1b2c3d4-3', city: 'Gdańsk', status: 'FAILED' },
])
const sortKey = ref('id')
const asc = ref(true)
const sortBy = (k) => {
  if (sortKey.value === k) asc.value = !asc.value
  else { sortKey.value = k; asc.value = true }
}
const sortedRows = computed(() =>
  [...rows.value].sort((a,b)=>{
    const x = (''+a[sortKey.value]).localeCompare((''+b[sortKey.value]), 'pl', { numeric:true, sensitivity:'base' })
    return asc.value ? x : -x
  })
)
</script>

<style scoped>
section + section { margin-top: 1.25rem; }
</style>
