<!--
ARCHITECTURE: App shell that must always render something, even if routing is broken.
It follows the manifesto by keeping the root declarative and adding a tiny visual heartbeat.
Responsibilities:
- Render a header and <router-view/>; show current route path for quick verification.
-->
<template>
  <div class="app-shell">
    <header class="app-head">
      <strong>Address Workbench</strong>
      <span class="path">route: {{ $route.fullPath }}</span>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
.app-shell { min-height: 100%; display: grid; grid-template-rows: auto 1fr; }
.app-head { display:flex; justify-content: space-between; align-items:center; padding: 8px 12px; border-bottom: 1px solid #eee; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
.path { opacity: .6; font-size: 12px; }
.app-main { padding: 12px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
</style>