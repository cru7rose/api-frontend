/**
 * ARCHITECTURE: main.js mounts App.vue, installs Pinia + Router, and provides DI singletons.
 * Responsibilities:
 * - Create AuthController and provide it under the 'auth' key so views (LoginView) can call auth.login().
 * - Bootstrap environment (orchestrator, googleKey, health) and provide them as well.
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import { createRouterWithKey } from "@/router/index";
import { AppBootstrapController } from "@/controllers/AppBootstrapController";
import { AuthController } from "@/controllers/AuthController";

// Use an async IIFE to allow top-level await for bootstrap
(async () => {
    const pinia = createPinia();

    // Initialize authentication controller and load any existing session
    const auth = new AuthController();
    auth.hydrateFromStorage();

    // Bootstrap application configuration and health checks
    const bootstrap = new AppBootstrapController();
    const boot = await bootstrap.bootstrap();

    // Create router instance, potentially passing config like Google API key
    const router = createRouterWithKey(boot.googleKey);

    // Create the main Vue application instance
    const app = createApp(App);

    // Global Vue error handler
    app.config.errorHandler = (err, instance, info) => {
        // eslint-disable-next-line no-console
        console.error("[vue-error]", err, info, instance);
    };
    // Global window error handler for unhandled promise rejections etc.
    window.addEventListener("error", (e) => {
        // eslint-disable-next-line
        console.error("[window-error]", e?.error || e?.message || e);
    });
    window.addEventListener("unhandledrejection", (e) => {
        // eslint-disable-next-line no-console
        console.error("[unhandled-rejection]", e?.reason || e);
    });


    // Install plugins
    app.use(pinia);
    app.use(router);

    // Dependency Injection: Provide shared instances to components
    app.provide("auth", auth); // Make AuthController available
    app.provide("orchestrator", boot.orchestrator); // Make main orchestrator available
    app.provide("googleKey", boot.googleKey); // Provide Google API Key
    app.provide("health", boot.health); // Provide health status

    // Mount the application to the DOM
    app.mount("#app");
})();