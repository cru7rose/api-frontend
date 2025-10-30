<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <section class="rounded-3xl p-6 sm:p-10 bg-white border border-slate-200 mb-8">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        <div class="max-w-2xl">
          <h1 class="text-3xl md:text-4xl font-bold leading-tight text-slate-900">
            Yellow & Blue Design Kit
          </h1>
          <p class="mt-2 text-slate-600">
            A modern, friendly interface kit for your app—buttons, badges, KPIs, progress, tables and more.
          </p>
        </div>
        <div class="rounded-2xl px-5 py-3 text-slate-900 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] shadow text-sm">
          White background • Theme: Yellow + Blue
        </div>
      </div>
    </section>

    <!-- KPIs -->
    <section class="grid gap-5 md:grid-cols-3 mb-8">
      <KpiTile icon="⏳" label="Pending" :value="kpi.pendingText()" />
      <KpiTile icon="✅" label="Clearance" :value="kpi.clearanceText()" />
      <KpiTile icon="🕒" label="Avg. Resolve" :value="kpi.avgResolutionText()" />
    </section>

    <!-- Actions -->
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

      <Card title="Progress">
        <div class="space-y-4">
          <ProgressBar :value="progress.percent" />
          <div class="text-sm text-slate-600">{{ progress.percent }}% complete</div>
          <div class="flex gap-2 flex-wrap">
            <Button variant="ghost" v-for="s in stepOrder" :key="s" @click="toggleStep(s)">{{ s }}</Button>
          </div>
        </div>
      </Card>

      <Card title="Toasts & Banners">
        <div class="space-y-3">
          <Button @click="notify('Saved successfully','success')">Success</Button>
          <Button variant="accent" @click="notify('Heads up, check details','info')">Info</Button>
          <Button variant="ghost" @click="notify('Something went wrong','error')">Error</Button>
          <p class="text-xs text-slate-500">Uses your <code>vue-toastification</code> setup.</p>
        </div>
      </Card>
    </section>

    <!-- Status Badges -->
    <section class="mb-8">
      <Card title="Statuses">
        <div class="flex flex-wrap gap-2">
          <Badge v-for="s in statusKeys" :key="s" :tone="toneFor(s)">{{ labelFor(s) }}</Badge>
        </div>
      </Card>
    </section>

    <!-- Table demo -->
    <section class="mb-12">
      <Card title="Worklist (Sample)">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-slate-500 border-b">
                <th class="py-2 pr-4">Order</th>
                <th class="py-2 pr-4">City</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sampleRows" :key="row.id" class="border-b last:border-0">
                <td class="py-3 pr-4 font-medium text-slate-900">{{ row.id.slice(0,8) }}</td>
                <td class="py-3 pr-4">{{ row.city }}</td>
                <td class="py-3 pr-4"><Badge :tone="toneFor(row.status)">{{ labelFor(row.status) }}</Badge></td>
                <td class="py-3 pr-4">
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

    <!-- CTA -->
    <section class="card-glass p-8 mb-20 flex items-center justify-between flex-col sm:flex-row gap-5">
      <div>
        <h3 class="text-xl font-semibold text-slate-900">Like this vibe?</h3>
        <p class="text-slate-600">Plug in the kit and your screens instantly feel intentional and premium.</p>
      </div>
      <div class="flex gap-3">
        <Button>Apply Theme</Button>
        <Button variant="accent">Docs</Button>
      </div>
    </section>
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import KpiTile from '@/components/ui/KpiTile.vue'

import { KpiViewModel } from '@/viewmodels/KpiViewModel'
import { VerificationProgressViewModel } from '@/viewmodels/VerificationProgressViewModel'
import { StatusBadgeViewModel } from '@/viewmodels/StatusBadgeViewModel'
import { useToast } from '@/composables/useToast'

const { success, info, error } = useToast()
const notify = (msg, type='success') => ({
  success: () => success(msg),
  info: () => info(msg),
  error: () => error(msg)
}[type]())

const kpi = new KpiViewModel({ pending: 42, clearancePercent: 87.2, avgMinutes: 96 })
const progressVM = new VerificationProgressViewModel()
const stepOrder = progressVM.steps.map(s => s.key)
const progress = progressVM.snapshot()
const toggleStep = (key) => {
  const done = !progressVM.steps.find(s => s.key === key)?.done
  progressVM.mark(key, done)
  Object.assign(progress, progressVM.snapshot())
}

// status badges
const sb = new StatusBadgeViewModel('INGESTED')
const statusKeys = Object.keys(sb.map)
const labelFor = (code) => new StatusBadgeViewModel(code).toObject().label
const toneFor = (code) => ({
  success: 'success', warning: 'warning', danger: 'danger',
  info: 'info', neutral: 'neutral'
})[new StatusBadgeViewModel(code).toObject().tone] || 'neutral'

// sample table data
const sampleRows = [
  { id: 'a1b2c3d4-1', city: 'Warsaw', status: 'PENDING_VERIFICATION' },
  { id: 'a1b2c3d4-2', city: 'Kraków', status: 'HAPPY_PATH_MATCHED' },
  { id: 'a1b2c3d4-3', city: 'Gdańsk', status: 'FAILED' },
]
</script>

<style scoped>
section + section { margin-top: 1.25rem; }
</style>
