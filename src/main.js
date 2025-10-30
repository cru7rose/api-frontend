import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import { createRouter } from "@/router/index";
import { AppBootstrapController } from "@/controllers/AppBootstrapController";
import { AuthController } from "@/controllers/AuthController";
import { GeoRuntime } from "@/adapters/GeoRuntime";
import { IntegrationOrchestrator } from "@/controllers/IntegrationOrchestrator";

// *** DODAJ TEN IMPORT STYLÓW ***
import '@/assets/theme.css';
// *** KONIEC IMPORTU ***

(async () => {
    const pinia = createPinia();
    // ... (reszta kodu bez zmian) ...

    const geoRuntime = new GeoRuntime(geoProviderConfig);

    // 4. Initialize GeoRuntime
    try {
        await geoRuntime.init(googleKey);
        console.log("[main.js] Geo Runtime initialization attempted.");
    } catch(err) {
        console.error("[main.js] Global Geo Runtime initialization failed:", err?.message || err);
    }

    const router = createRouter(geoRuntime);
    const app = createApp(App);

    app.config.errorHandler = (err, instance, info) => console.error("[vue-error]", err, info, instance);
    window.addEventListener("error", (e) => console.error("[window-error]", e?.error || e?.message || e));
    window.addEventListener("unhandledrejection", (e) => console.error("[unhandled-rejection]", e?.reason || e));

    app.use(pinia);
    app.use(router);

    const orchestrator = new IntegrationOrchestrator(geoRuntime, null);
    app.provide("orchestrator", orchestrator);
    app.provide("auth", auth);
    app.provide("config", config);
    app.provide("health", health);
    app.provide("geoRuntime", geoRuntime);

    app.mount("#app");
})();