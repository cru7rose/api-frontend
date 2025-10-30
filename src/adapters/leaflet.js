// Minimal Leaflet adapter that provides create() for your MapController.
// Assumes Leaflet CSS is imported in src/assets/main.css (already done).

import * as L from 'leaflet'

export function createLeafletAdapter() {
    return {
        async create(containerEl, options = {}) {
            // Default center/zoom if your controller doesn't pass them
            const center = options.center || [52.2297, 21.0122] // Warsaw default
            const zoom = options.zoom ?? 6

            const map = L.map(containerEl).setView(center, zoom)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map)

            return {
                raw: map,
                setCenter(lat, lon, z) {
                    if (z) map.setView([lat, lon], z); else map.setView([lat, lon])
                },
                fitBounds(bounds) {
                    map.fitBounds(bounds, { padding: [20, 20] })
                },
                addMarker(lat, lon, opts = {}) {
                    const marker = L.marker([lat, lon], opts).addTo(map)
                    return marker
                },
                removeLayer(layer) {
                    if (layer) map.removeLayer(layer)
                },
                addPolyline(coords, opts = {}) {
                    const poly = L.polyline(coords, opts).addTo(map)
                    return poly
                },
                invalidateSize() {
                    map.invalidateSize()
                },
                destroy() {
                    map.remove()
                },
            }
        },
    }
}
