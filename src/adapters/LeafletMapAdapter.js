// FILE: src/adapters/LeafletMapAdapter.js
// MODIFIED - Added multiple markers, routing, and proper config
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// --- Create custom Green and Red icons ---
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
// --- End custom icons ---

/**
 * ARCHITECTURE: LeafletMapAdapter provides a map implementation using Leaflet JS.
 * REFACTORED: Now supports distinct pickup/delivery markers and OSRM routing.
 */
export class LeafletMapAdapter {
    constructor(osrmRoutingUrl = null) {
        this._map = null;
        this._pickupMarker = null;
        this._deliveryMarker = null;
        this._routeLine = null;
        this._osrmRoutingUrl = osrmRoutingUrl; // URL for OSRM service
        this._defaultCenter = { lat: 52.2297, lon: 21.0122 }; // Warsaw
        this._defaultZoom = 6;
    }

    async create(container, options) {
        if (!container) throw new Error("LeafletMapAdapter.create: container is required.");
        if (this._map) {
            await this.destroy();
        }
        const center = L.latLng(options?.lat ?? this._defaultCenter.lat, options?.lon ?? this._defaultCenter.lon);
        const zoom = options?.zoom ?? this._defaultZoom;
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        this._map = L.map(container, { center, zoom, layers: [osmLayer], zoomControl: true });

        // Initialize markers (hidden at first)
        this._pickupMarker = L.marker(center, { icon: greenIcon, opacity: 0 });
        this._deliveryMarker = L.marker(center, { icon: redIcon, opacity: 0 });
        this._pickupMarker.addTo(this._map);
        this._deliveryMarker.addTo(this._map);

        setTimeout(() => this._map?.invalidateSize(), 100);
        return true;
    }

    async setCenter(lat, lon, zoom) {
        if (!this._map) throw new Error("LeafletMapAdapter.setCenter: map not created.");
        const center = L.latLng(lat, lon);
        const newZoom = (typeof zoom === "number")? zoom : this._map.getZoom();
        this._map.setView(center, newZoom);
        return true;
    }

    // --- NEW MARKER METHODS ---
    async setMarker(lat, lon) {
        // Legacy method, just moves the pickup marker
        return this.setPickupMarker(lat, lon);
    }

    async setPickupMarker(lat, lon, zoomTo = false) {
        if (!this._map || !this._pickupMarker) throw new Error("LeafletMapAdapter.setPickupMarker: map/marker not created.");
        const pos = L.latLng(lat, lon);
        this._pickupMarker.setLatLng(pos).setOpacity(1); // Make visible
        if(zoomTo) this._map.setView(pos, 15);
        return true;
    }

    async setDeliveryMarker(lat, lon, zoomTo = false) {
        if (!this._map || !this._deliveryMarker) throw new Error("LeafletMapAdapter.setDeliveryMarker: map/marker not created.");
        const pos = L.latLng(lat, lon);
        this._deliveryMarker.setLatLng(pos).setOpacity(1); // Make visible
        if(zoomTo) this._map.setView(pos, 15);
        return true;
    }
    // --- END NEW MARKER METHODS ---

    async fitBounds(pickupPos, deliveryPos) {
        if (!this._map) return false;
        if (!pickupPos || !deliveryPos) return false;

        const pLatLon = L.latLng(pickupPos.lat, pickupPos.lon);
        const dLatLon = L.latLng(deliveryPos.lat, deliveryPos.lon);

        this._map.fitBounds(L.latLngBounds([pLatLon, dLatLon]), { padding: [50, 50] }); // Add 50px padding
        return true;
    }

    async drawRoute(pickupPos, deliveryPos) {
        if (!this._osrmRoutingUrl) {
            console.warn("MapAdapter: OSRM routing URL not configured. Skipping route line.");
            return false;
        }
        if (!this._map) return false;
        if (!pickupPos || !deliveryPos) return false;

        // Clear existing route
        if (this._routeLine) {
            this._routeLine.remove();
            this._routeLine = null;
        }

        // OSRM expects {lon},{lat};{lon},{lat}
        const coords = `${pickupPos.lon},${pickupPos.lat};${deliveryPos.lon},${deliveryPos.lat}`;
        const url = `${this._osrmRoutingUrl}/route/v1/driving/${coords}?overview=full&geometries=polyline`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`OSRM responded with ${response.status}`);
            const data = await response.json();

            if (data.routes && data.routes[0] && data.routes[0].geometry) {
                // Need to decode polyline. Using a simple decoder.
                const geometry = data.routes[0].geometry;
                const latlngs = this.decodePolyline(geometry); // Implement decoder

                this._routeLine = L.polyline(latlngs, { color: 'var(--color-primary)', weight: 3, opacity: 0.7 }).addTo(this._map);
                return true;
            }
        } catch (e) {
            console.error("LeafletMapAdapter: Failed to fetch route from OSRM:", e);
        }
        return false;
    }

    // Polyline decoder (common algorithm)
    decodePolyline(str, precision = 5) {
        let index = 0, lat = 0, lng = 0, coordinates = [],
            shift = 0, result = 0,
            byte = null, latitude_change, longitude_change,
            factor = Math.pow(10, precision);

        while (index < str.length) {
            byte = null; shift = 0; result = 0;
            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = result = 0;
            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += latitude_change;
            lng += longitude_change;
            coordinates.push([lat / factor, lng / factor]);
        }
        return coordinates;
    }

    async destroy() {
        if (this._pickupMarker) this._pickupMarker.remove();
        if (this._deliveryMarker) this._deliveryMarker.remove();
        if (this._routeLine) this._routeLine.remove();
        if (this._map) this._map.remove();

        this._map = null;
        this._pickupMarker = null;
        this._deliveryMarker = null;
        this._routeLine = null;
        return true;
    }
}