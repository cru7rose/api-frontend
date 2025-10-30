import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createRouter } from '@/router';

// ✅ Load Tailwind layers + theme tokens
import '@/assets/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const router = createRouter();
app.use(router);

router.isReady().then(() => {
    app.mount('#app');
});
