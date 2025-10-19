/**
 * ARCHITECTURE: main.js bootstraps auth + env + orchestrator, builds router, and mounts a clean root.
 * Responsibilities:
 * - Install Pinia, hydrate Auth, build router, mount a single root that renders <router-view/>.
 */
import { createApp, h, provide } from "vue";
import { createPinia } from "pinia";
import "@/assets/main.css";
import { AppBootstrapController } from "@/controllers/AppBootstrapController";
import { createRouterWithKey } from "@/router/index";
import { AuthController } from "@/controllers/AuthController";

(async () => {
  const pinia = createPinia();

  const auth = new AuthController();
  auth.hydrateFromStorage();

  const bootstrap = new AppBootstrapController();
  const boot = await bootstrap.bootstrap();
  const router = createRouterWithKey(boot.googleKey);

  const Root = {
    name: "Root",
    setup() {
      provide("auth", auth);
      provide("orchestrator", boot.orchestrator);
      provide("googleKey", boot.googleKey);
      provide("health", boot.health);
      return () => h("router-view");
    },
  };

  const app = createApp(Root);

  app.config.errorHandler = (err, _instance, _info) => {
    console.error("[vue-error]", err);
  };
  window.addEventListener("error", (e) => {
    console.error("[window-error]", e?.error || e?.message || e);
  });

  app.use(pinia);
  app.use(router);
  app.mount("#app");
})();
