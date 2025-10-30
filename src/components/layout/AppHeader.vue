<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Left -->
      <div class="flex items-center gap-3">
        <button
            class="inline-flex items-center justify-center rounded-xl p-2 hover:bg-yellow-100 border border-transparent hover:border-yellow-300 transition"
            @click="$emit('toggle-sidebar')"
            aria-label="Toggle sidebar"
        >
          <Bars3Icon class="h-6 w-6 text-blue-700" aria-hidden="true" />
        </button>
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-xl bg-yellow-400 ring-2 ring-blue-600"></div>
          <span class="font-semibold text-slate-900">Yellow–Blue UI</span>
        </div>
      </div>

      <!-- Right -->
      <Menu as="div" class="relative">
        <MenuButton class="flex items-center p-1.5 rounded-full hover:bg-slate-100 transition">
          <span class="sr-only">Open user menu</span>
          <UserCircleIcon class="h-7 w-7 text-blue-600" aria-hidden="true" />
          <span class="hidden lg:flex lg:items-center">
            <span class="ml-2 text-sm font-semibold text-gray-900" aria-hidden="true">{{ username }}</span>
            <ChevronDownIcon class="ml-1 h-4 w-4 text-gray-500" aria-hidden="true" />
          </span>
        </MenuButton>

        <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
              class="absolute right-0 z-50 mt-2.5 w-48 origin-top-right rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <button
                  @click="handleLogout"
                  :class="[
                  active ? 'bg-yellow-50 text-gray-900' : 'text-gray-700',
                  'block w-full px-4 py-2 text-left text-sm'
                ]"
              >
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { Bars3Icon, UserCircleIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth.js'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()

// Defensive username: supports either flat or nested user objects
const username = computed(() => auth?.username || auth?.user?.username || 'User')

const handleLogout = async () => {
  try {
    await auth?.logout?.()
  } catch (_) {
    /* ignore */
  }
  router.push('/login')
}
</script>
