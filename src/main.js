import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// whatever adapter you use:
import { createGeoRuntime } from '@/geo/runtime'; // example factory

const app = createApp(App);
app.use(router);

// Provide geoRuntime globally so all editors can inject it
app.provide('geoRuntime', createGeoRuntime());

// Optional: provide a notifier
app.provide('showNotification', (msg, type) => {
    // wire to your notification store/toast
    console.log(`[${type}] ${msg}`);
});

app.mount('#app');
