// ============================================================================
// Frontend: Fix main.js Initialization Logic
// FILE: src/main.js (Supersedes previous version)
// REASON: Fixes 'geoProviderConfig is not defined' and 'googleKey is not defined'
//         ReferenceErrors by correctly running the AppBootstrapController *first*
//         and defining the config objects before they are used.
//         Also fixes a latent 'auth is not defined' error.
// ============================================================================

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

    // === START FIX: BOOTSTRAP AND CONFIG ===
    // 1. Run bootstrap FIRST to load configuration from environment
    const bootstrap = new AppBootstrapController();
    const { config, health } = await bootstrap.bootstrap();

    // 2. Extract Google Key from the loaded config [cite: 6365]
    const googleKey = config?.GOOGLE_MAPS_API_KEY || null;

    // 3. Define the missing geoProviderConfig object using loaded config
    // These URLs MUST match your Nginx proxy paths
    const geoProviderConfig = {
        map: import.meta.env.VITE_MAP_PROVIDER || 'leaflet',
        geocode: import.meta.env.VITE_GEOCODE_PROVIDER || 'nominatim',
        places: import.meta.env.VITE_PLACES_PROVIDER || 'none',
        nominatimEmail: import.meta.env.VITE_NOMINATIM_EMAIL || 'danxils-triage@example.com',
        // Use the PROXY paths, not localhost ports
        nominatimUrl: import.meta.env.VITE_GEOCODE_PROVIDER_URL || '/nominatim/search', // Proxy path for geocoding
        routingUrl: import.meta.env.VITE_ROUTING_PROVIDER_URL || '/osrm', // Base OSRM proxy path
    };
    // === END FIX ===

    const geoRuntime = new GeoRuntime(geoProviderConfig); // <-- FIXED

    // 4. Initialize GeoRuntime
    try {
        await geoRuntime.init(googleKey); // <-- FIXED [cite: 5418]
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

    // === START FIX: DEFINE AND PROVIDE CONTROLLERS ===
    const auth = new AuthController(); // <-- Define auth controller [cite: 5416]
    const orchestrator = new IntegrationOrchestrator(geoRuntime, null); [cite: 5417, 5419]

    app.provide("orchestrator", orchestrator);
    app.provide("auth", auth); // <-- Provide defined auth controller
    app.provide("config", config);
    app.provide("health", health);
    app.provide("geoRuntime", geoRuntime);
    // === END FIX ===

    app.mount("#app");
})();