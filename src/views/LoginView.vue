<!--
ARCHITECTURE: LoginView authenticates via AuthController and redirects to the intended route.
It follows the manifesto by delegating auth logic to the controller and keeping UI declarative.
Responsibilities:
- Collect credentials, call auth.login(), then navigate to ?r=... or /dashboard.
-->
<template>
  <section class="login">
    <header><h1>Sign in</h1></header>
    <form @submit.prevent="onSubmit">
      <label>Username <input v-model="username" autocomplete="username" /></label>
      <label>Password <input v-model="password" type="password" autocomplete="current-password" /></label>
      <button :disabled="busy" type="submit">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p v-if="err" class="err">{{ err }}</p>
    </form>
  </section>
</template>

<script setup>
import { inject, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const auth = inject("auth"); // provided in main.js
const route = useRoute();
const router = useRouter();

const username = ref("admin");
const password = ref("pass");
const busy = ref(false);
const err = ref("");

async function onSubmit() {
  err.value = "";
  busy.value = true;
  try {
    const r = await auth.login(username.value, password.value);
    if (!r.ok) throw r.error || new Error("Login failed");
    const go = String(route.query.r || "/dashboard");
    router.push(go);
  } catch (e) {
    err.value = e?.message || "Login failed";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.login { max-width: 420px; margin: 8vh auto; padding: 16px; border: 1px solid #eee; border-radius: 8px; background: #fff; display: grid; gap: 12px; }
form { display: grid; gap: 10px; }
label { display: grid; gap: 4px; font-size: 12px; }
input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
button { padding: 8px 10px; font-size: 14px; }
.err { color: #c0392b; margin: 0; }
</style>
