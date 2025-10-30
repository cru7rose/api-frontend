// Bridge so the app can import "@/geo/runtime" consistently
// and ALWAYS have a ready Leaflet adapter, even if the underlying class
// requires an explicit init.

import { GeoRuntime } from '@/adapters/GeoRuntime';

function readEnv() {
    const env = import.meta?.env ?? {};
    return {
        map: (env.VITE_MAP_PROVIDER || 'leaflet').toLowerCase(),
        geocode: (env.VITE_GEOCODE_PROVIDER || 'nominatim').toLowerCase(),
        places: (env.VITE_PLACES_PROVIDER || 'none').toLowerCase(),
        nominatimEmail: env.VITE_NOMINATIM_EMAIL || 'admin@danxils.com',
        nominatimUrl: (env.VITE_NOMINATIM_URL || '/nominatim').replace(/\/+$/, ''),
        routingUrl: (env.VITE_ROUTING_PROVIDER_URL || '/osrm').replace(/\/+$/, ''),
        tileUrl: (env.VITE_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
        maxZoom: Number(env.VITE_TILE_MAX_ZOOM || 19),
        attribution:
            env.VITE_TILE_ATTR ||
            '&copy; OpenStreetMap contributors',
    };
}

/**
 * Ensure runtime has a working Leaflet adapter:
 * - If your GeoRuntime exposes an init/set method, use it.
 * - Otherwise, polyfill mapAdapter() so callers work immediately.
 */
async function ensureLeafletAdapter(runtime, cfg) {
    const adapter = {
        tileUrl: cfg.tileUrl,
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
    };

    // Preferred: if your class exposes a setter/initializer, use it
    if (typeof runtime.initLeaflet === 'function') {
        await runtime.initLeaflet(adapter);
        return;
    }
    if (typeof runtime.setMapAdapter === 'function') {
        runtime.setMapAdapter(adapter);
        return;
    }

    // Fallback: polyfill mapAdapter() if it's missing or throws
    let safeGetter = null;
    try {
        if (typeof runtime.mapAdapter === 'function') {
            // Call once defensively; if it throws "not initialized", we'll override.
            runtime.mapAdapter();
            safeGetter = runtime.mapAdapter.bind(runtime);
        }
    } catch (_) {
        // mapAdapter exists but is not initialized; override below
    }

    if (!safeGetter) {
        // Provide a stable getter
        safeGetter = () => adapter;
    }

    // Finalize the getter so consumers (MapController) can call it freely
    runtime.mapAdapter = safeGetter;
}

/**
 * Factory used by main.js
 */
export async function createGeoRuntime() {
    const cfg = readEnv();
    const runtime = new GeoRuntime({
        map: cfg.map,               // 'leaflet' | 'google'
        geocode: cfg.geocode,       // 'nominatim' | 'google'
        places: cfg.places,         // 'none' | 'google'
        nominatimEmail: cfg.nominatimEmail,
        nominatimUrl: cfg.nominatimUrl,
        routingUrl: cfg.routingUrl,
    });

    // Always ensure Leaflet adapter is ready to use
    if (cfg.map === 'leaflet') {
        await ensureLeafletAdapter(runtime, cfg);
    }

    // Optionally, expose read-only geocode/routing surfaces if your class doesn’t
    if (!runtime.geocode) {
        runtime.geocode = {
            provider: cfg.geocode,
            baseUrl: cfg.nominatimUrl,
            email: cfg.nominatimEmail,
        };
    }
    if (!runtime.routing) {
        runtime.routing = {
            provider: 'osrm',
            baseUrl: cfg.routingUrl,
        };
    }

    return runtime;
}

export default createGeoRuntime;
