import { createApp } from 'vue';
import App from './App.vue';
import { createRouter } from './router';
import { createPinia } from 'pinia';
import './assets/main.css';

// 👇 use the new bridge (reuses your adapters/GeoRuntime)
import { createGeoRuntime } from '@/geo/runtime';

const app = createApp(App);
app.use(createPinia());
app.use(createRouter());

// Provide geoRuntime once for the whole app
const geoRuntime = createGeoRuntime();
// If your GeoRuntime requires async init (e.g., Google), you can await it before mount:
// await geoRuntime.init(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

app.provide('geoRuntime', geoRuntime);

// Optional: notification hook used in editor
app.provide('showNotification', (msg, type = 'info') => console.log(`[${type}] ${msg}`));

app.mount('#app');
