// Bridge so the app can import "@/geo/runtime" consistently.
// Reuses your existing adapters/GeoRuntime.js class.

import { GeoRuntime } from '@/adapters/GeoRuntime';

// Map env → GeoRuntime config
function readEnv() {
    const env = import.meta?.env ?? {};
    return {
        map: (env.VITE_MAP_PROVIDER || 'leaflet').toLowerCase(),           // 'leaflet' | 'google'
        geocode: (env.VITE_GEOCODE_PROVIDER || 'nominatim').toLowerCase(), // 'nominatim' | 'google'
        places: (env.VITE_PLACES_PROVIDER || 'none').toLowerCase(),        // 'none' | 'google'
        nominatimEmail: env.VITE_NOMINATIM_EMAIL || 'admin@danxils.com',
        nominatimUrl: (env.VITE_NOMINATIM_URL || '/nominatim').replace(/\/+$/, ''),
        routingUrl: (env.VITE_ROUTING_PROVIDER_URL || '/osrm').replace(/\/+$/, ''),
    };
}

// Factory used by main.js
export function createGeoRuntime() {
    const cfg = readEnv();
    return new GeoRuntime(cfg);
}

export default createGeoRuntime;
