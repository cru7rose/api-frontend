/**
 * ARCHITECTURE: main.js mounts App.vue with router and pinia, and emits probe breadcrumbs.
 * It follows the manifesto by ensuring a visible shell renders even if routes fail.
 * Responsibilities:
 * - Install Pinia, build router, mount App, and log deterministic startup milestones.
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import { createRouterWithKey } from "@/router/index";
import { AppBootstrapController } from "@/controllers/AppBootstrapController";
import { StartupProbe } from "@/debug/StartupProbe";

(async () => {
  const probe = new StartupProbe();
  probe.mark("init:begin");

  const pinia = createPinia();
  probe.mark("pinia:ready");

  const bootstrap = new AppBootstrapController();
  const boot = await bootstrap.bootstrap();
  probe.mark("bootstrap:done");

  const router = createRouterWithKey(boot.googleKey);
  probe.mark("router:created");

  const app = createApp(App);

  app.config.errorHandler = (err) => {
    console.error("[vue-error]", err);
    probe.mark(`vue-error:${err?.message || err}`);
  };
  window.addEventListener("error", (e) => {
    console.error("[window-error]", e?.error || e?.message || e);
    probe.mark(`window-error:${e?.message || e}`);
  });

  app.use(pinia);
  app.use(router);
  probe.mark("plugins:used");

  app.mount("#app");
  probe.mark("mounted");
})();