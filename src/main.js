import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter } from './router'
import { createGeoRuntime } from '@/geo/runtime'
import './assets/main.css'

(async () => {
    const app = createApp(App)
    app.use(createPinia())

    const geoRuntime = await createGeoRuntime()
    app.provide('geoRuntime', geoRuntime)

    const router = createRouter(geoRuntime)
    app.use(router)

    app.mount('#app')
})()
