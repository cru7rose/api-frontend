// GeoRuntime: central place to configure Map, Geocode and Routing adapters
// Contracts expected by the rest of your app:
// - mapAdapter(): { create(containerEl): MapInstance, setView/fitBounds* delegated by MapController }
// - geocodingAdapter(): { geocode(addressLike): Promise<{ latitude, longitude }|null> }
// - routingAdapter(): { route(p1, p2): Promise<RouteGeoJSON|...> } (minimal surface; extend as needed)

import { createLeafletAdapter } from '@/geo/adapters/leaflet'
import { createNominatimAdapter } from '@/geo/adapters/nominatim'
import { createOsrmAdapter } from '@/geo/adapters/osrm'

function readEnv(key, fallback = '') {
    const v = (import.meta?.env?.[key] ?? '').toString().trim()
    return v || fallback
}

export async function createGeoRuntime() {
    // Read frontend env (works the same in Docker build and Vite dev)
    const geocodeProvider = readEnv('VITE_GEOCODE_PROVIDER', 'nominatim')
    const nominatimUrl = readEnv('VITE_NOMINATIM_URL', '/nominatim')
    const nominatimEmail = readEnv('VITE_NOMINATIM_EMAIL', 'admin@danxils.com')
    const routingUrl = readEnv('VITE_ROUTING_PROVIDER_URL', '/osrm')

    // Initialize adapters
    const map = createLeafletAdapter()
    const geocode =
        geocodeProvider === 'nominatim'
            ? createNominatimAdapter({ baseUrl: nominatimUrl, email: nominatimEmail })
            : null
    const routing = createOsrmAdapter({ baseUrl: routingUrl })

    const runtime = {
        mapAdapter() {
            if (!map?.create) throw new Error('GeoRuntime: Leaflet Map adapter not initialized.')
            return map
        },
        geocodingAdapter() {
            if (!geocode?.geocode) throw new Error('GeoRuntime: Nominatim Geocoding adapter not initialized.')
            return geocode
        },
        routingAdapter() {
            return routing // optional usage
        },
        // Optional: small logger
        logSummary() {
            // eslint-disable-next-line no-console
            console.log('[GeoRuntime] Configured Providers - Map: leaflet, Geocode: %s, Places: none, Routing: OSRM', geocodeProvider)
        },
    }

    runtime.logSummary()
    return runtime
}
