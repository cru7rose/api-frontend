// Bridge so the app can import "@/geo/runtime" and get a READY map adapter.
// Reuses your existing adapters/GeoRuntime and guarantees adapter.create().

import { GeoRuntime } from '@/adapters/GeoRuntime';
import * as L from 'leaflet';

function readEnv() {
    const env = import.meta?.env ?? {};
    return {
        map: (env.VITE_MAP_PROVIDER || 'leaflet').toLowerCase(),
        geocode: (env.VITE_GEOCODE_PROVIDER || 'nominatim').toLowerCase(),
        places: (env.VITE_PLACES_PROVIDER || 'none').toLowerCase(),
        nominatimEmail: env.VITE_NOMINATIM_EMAIL || 'admin@danxils.com',
        nominatimUrl: (env.VITE_NOMINATIM_URL || '/nominatim').replace(/\/+$/, ''),
        routingUrl: (env.VITE_ROUTING_PROVIDER_URL || '/osrm').replace(/\/+$/, ''),
        tileUrl: env.VITE_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: Number(env.VITE_TILE_MAX_ZOOM || 19),
        attribution: env.VITE_TILE_ATTR || '&copy; OpenStreetMap contributors',
    };
}

// Build a Leaflet adapter object that MapController can consume.
function buildLeafletAdapter(cfg) {
    return {
        /**
         * Create and attach a Leaflet map to the given container element.
         * Returns the Leaflet map instance.
         */
        create(container, options = {}) {
            if (!container) throw new Error('Leaflet adapter: container is required');
            const map = L.map(container, {
                zoomControl: true,
                ...options,
            });

            L.tileLayer(cfg.tileUrl, {
                attribution: cfg.attribution,
                maxZoom: cfg.maxZoom,
            }).addTo(map);

            // Provide small helpers some controllers like to call
            map.__adapter = {
                setCenter(lat, lon, zoom) {
                    if (typeof zoom === 'number') map.setView([lat, lon], zoom);
                    else map.setView([lat, lon]);
                },
                fitBounds(bounds) {
                    // bounds: [[lat1, lon1], [lat2, lon2]]
                    map.fitBounds(bounds);
                },
                addMarker(lat, lon, opts = {}) {
                    return L.marker([lat, lon], opts).addTo(map);
                },
            };

            return map;
        },
    };
}

async function ensureMapAdapter(runtime, cfg) {
    const adapter = buildLeafletAdapter(cfg);

    // If your GeoRuntime supports explicit setters, use them:
    if (typeof runtime.initLeaflet === 'function') {
        await runtime.initLeaflet(adapter);
        return;
    }
    if (typeof runtime.setMapAdapter === 'function') {
        runtime.setMapAdapter(adapter);
        return;
    }

    // Otherwise guarantee a working getter.
    runtime.mapAdapter = () => adapter;
}

export async function createGeoRuntime() {
    const cfg = readEnv();

    const runtime = new GeoRuntime({
        map: cfg.map,
        geocode: cfg.geocode,
        places: cfg.places,
        nominatimEmail: cfg.nominatimEmail,
        nominatimUrl: cfg.nominatimUrl,
        routingUrl: cfg.routingUrl,
    });

    // Ensure adapter exists and has create()
    if (cfg.map === 'leaflet') {
        await ensureMapAdapter(runtime, cfg);
    }

    // Fill surfaces if your class doesn’t expose them
    if (!runtime.geocode) {
        runtime.geocode = { provider: cfg.geocode, baseUrl: cfg.nominatimUrl, email: cfg.nominatimEmail };
    }
    if (!runtime.routing) {
        runtime.routing = { provider: 'osrm', baseUrl: cfg.routingUrl };
    }

    return runtime;
}

export default createGeoRuntime;
