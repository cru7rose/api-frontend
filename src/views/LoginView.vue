<!-- =========================================================================
views/LoginView.vue — Minimal, production-friendly login screen
Wires ONLY to the canonical store so the request path is /auth/login.
============================================================================= -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-white">
    <div class="w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6">
      <h1 class="text-xl font-semibold text-slate-800 mb-1">Sign in</h1>
      <p class="text-sm text-slate-500 mb-6">Use your DANXILS credentials</p>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Username</label>
          <input v-model="username" type="text" autocomplete="username" required
                 class="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Password</label>
          <input v-model="password" type="password" autocomplete="current-password" required
                 class="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit"
                :disabled="submitting"
                class="w-full rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-2 transition">
          <span v-if="!submitting">Sign in</span>
          <span v-else>Signing in…</span>
        </button>

        <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const submitting = ref(false);
const error = ref("");

async function onSubmit() {
  error.value = "";
  submitting.value = true;
  const ok = await auth.login(username.value, password.value);
  submitting.value = false;

  if (ok) {
    const next = auth.redirectPath || route.query?.redirect || "/worklist";
    router.replace(String(next));
  } else {
    error.value = auth.authError || "Invalid credentials.";
  }
}
</script>
