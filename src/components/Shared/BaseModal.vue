<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
      <TransitionChild
          as="template"
          enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
          <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0 sm:scale-100"
              leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
                class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all ring-1 ring-black/5"
            >
              <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <DialogTitle class="text-base font-semibold text-slate-900">
                  <slot name="title">Dialog</slot>
                </DialogTitle>
                <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-100 transition"
                    @click="$emit('close')"
                    aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div class="px-5 py-4">
                <slot />
              </div>

              <div class="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <slot name="footer">
                  <button
                      type="button"
                      class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                      @click="$emit('close')"
                  >
                    Close
                  </button>
                </slot>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

// kebab-case `is-open` in template maps to `isOpen` prop here
defineProps({ isOpen: { type: Boolean, required: true } })
defineEmits(['close'])
</script>
