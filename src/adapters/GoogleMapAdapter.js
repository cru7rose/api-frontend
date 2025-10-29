// FILE: src/adapters/GoogleMapAdapter.js
// KEPT AS IS (from previous restore) - needed for optional Google usage
/**
 * ARCHITECTURE: GoogleMapAdapter provides a concrete map implementation for MapController using Google Maps JS API.
 * Encapsulates vendor-specific map calls behind a small, explicit interface.
 * Responsibilities: Create/destroy map, set center/zoom, manage a single primary marker.
 */
export class GoogleMapAdapter {
  constructor(googleObj) {
    if (!googleObj || !googleObj.maps) throw new Error("GoogleMapAdapter: google maps object required.");
    this.google = googleObj;
    this._map = null;
    this._marker = null;
  }

  async create(container, options) {
    if (!container) throw new Error("GoogleMapAdapter.create: container is required.");
    const center = { lat: options?.lat ?? 52.2297, lng: options?.lon ?? 21.0122 };
    const zoom = options?.zoom ?? 12;
    this._map = new this.google.maps.Map(container, { center, zoom, mapTypeControl: false, streetViewControl: false });
    if (this.google.maps.marker?.AdvancedMarkerElement) {
      this._marker = new this.google.maps.marker.AdvancedMarkerElement({ position: center, map: this._map, gmpDraggable: false });
    } else {
      this._marker = new this.google.maps.Marker({ position: center, map: this._map });
    }
    return true;
  }

  async setCenter(lat, lon, zoom) {
    if (!this._map) throw new Error("GoogleMapAdapter.setCenter: map not created.");
    const center = { lat, lng: lon };
    this._map.setCenter(center);
    if (typeof zoom === "number") this._map.setZoom(zoom);
    return true;
  }

  async setMarker(lat, lon) {
    if (!this._map || !this._marker) throw new Error("GoogleMapAdapter.setMarker: map not created.");
    const pos = { lat, lng: lon };
    if (typeof this._marker. G === 'function') { // Legacy Marker
      this._marker.setPosition(pos);
    } else if (this._marker.position) { // AdvancedMarkerElement
      this._marker.position = pos;
    }
    return true;
  }

  async fit(lat, lon) {
    if (!this._map) throw new Error("GoogleMapAdapter.fit: map not created.");
    const bounds = new this.google.maps.LatLngBounds();
    bounds.extend(new this.google.maps.LatLng(lat, lon));
    this._map.fitBounds(bounds, 64);
    return true;
  }

  async destroy() {
    if (this._marker) {
      this._marker.map = null;
      if (typeof this._marker.setMap === 'function') { this._marker.setMap(null); }
      this._marker = null;
    }
    if (this._map) {
      this._map = null;
    }
    return true;
  }
}