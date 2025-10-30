import { createApp } from 'vue';
import App from './App.vue';
import { createRouter } from './router';
import { createPinia } from 'pinia';
import './assets/main.css';
import { createGeoRuntime } from '@/geo/runtime';

const app = createApp(App);
app.use(createPinia());
app.use(createRouter());

// ✅ No top-level await — wrap in an async IIFE
(async () => {
    const geoRuntime = await createGeoRuntime();
    app.provide('geoRuntime', geoRuntime);

    // Optional notifier used in Editor
    app.provide('showNotification', (msg, type = 'info') =>
        console.log(`[${type}] ${msg}`)
    );

    app.mount('#app');
})();
