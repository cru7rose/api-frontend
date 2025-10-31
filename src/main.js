// ============================================================================
// Frontend: Update main.js
// REASON: Default OSRM routing URL to the proxy path '/osrm'.
// REASON: Fix Nominatim default URL to include /search.php.
// REASON: Provide geoRuntime to the Vue app instance.
// ============================================================================
// FILE: src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import { createRouter } from "@/router/index";
import { AppBootstrapController } from "@/controllers/AppBootstrapController";
import { AuthController } from "@/controllers/AuthController";
import { GeoRuntime } from "@/adapters/GeoRuntime";
import { IntegrationOrchestrator } from "@/controllers/IntegrationOrchestrator";
import '@/assets/theme.css';

(async () => {
    const pinia = createPinia();
    const auth = new AuthController();
    auth.hydrateFromStorage();

    const bootstrap = new AppBootstrapController();
    const boot = await bootstrap.bootstrap();
    const config = boot.config || {};
    const health = boot.health || { ok: false };

    // 3. Configure GeoRuntime
    const geoProviderConfig = {
        map: (config?.VITE_MAP_PROVIDER || 'leaflet').toLowerCase(),
        geocode: (config?.VITE_GEOCODE_PROVIDER || 'nominatim').toLowerCase(),
        places: (config?.VITE_PLACES_PROVIDER || 'none').toLowerCase(),
        nominatimEmail: config?.VITE_NOMINATIM_EMAIL || 'triage-app@example.com',

        // *** THIS IS THE FIX FOR 406 Not Acceptable ***
        // Your server requires search.php
        nominatimUrl: config?.VITE_NOMINATIM_URL || '/nominatim/search.php',

        // Use the proxy path, not a direct IP
        routingUrl: config?.VITE_ROUTING_PROVIDER_URL || '/osrm',
    };
    const googleKey =
        config?.GOOGLE_MAPS_API_KEY || config?.VITE_GOOGLE_MAPS_API_KEY || null;

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
    app.provide("geoRuntime", geoRuntime); // <-- Provide geoRuntime

    app.mount("#app");
})();