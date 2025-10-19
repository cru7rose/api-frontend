/**
 * ARCHITECTURE: MapController coordinates a map adapter to create a map, update its marker, and recenter.
 * It follows the manifesto by hiding vendor API behind a minimal surface tailored to the editor workflow.
 * Responsibilities:
 * - Initialize the map, move the marker to a coordinate, and recenter with optional zoom changes.
 * - Provide idempotent destroy() to free resources on route leave.
 */
export class MapController {
  constructor(mapAdapter) {
    this.adapter = mapAdapter;
    this._container = null;
    this._center = { lat: 52.2297, lon: 21.0122, zoom: 12 };
    this._ready = false;
  }

  async init(container, options) {
    this._container = container;
    const opt = options || this._center;
    await this.adapter.create(container, { lat: opt.lat, lon: opt.lon, zoom: opt.zoom });
    this._center = { lat: opt.lat, lon: opt.lon, zoom: opt.zoom };
    this._ready = true;
    return true;
  }

  async updateMarker(lat, lon, recenter = false) {
    if (!this._ready) throw new Error("MapController: map not initialized.");
    await this.adapter.setMarker(lat, lon);
    if (recenter) {
      await this.adapter.setCenter(lat, lon, this._center.zoom);
      this._center = { ...this._center, lat, lon };
    }
    return true;
  }

  async recenter(zoom) {
    if (!this._ready) throw new Error("MapController: map not initialized.");
    const z = typeof zoom === "number" ? zoom : this._center.zoom;
    await this.adapter.setCenter(this._center.lat, this._center.lon, z);
    this._center.zoom = z;
    return true;
  }

  async destroy() {
    await this.adapter.destroy();
    this._ready = false;
    this._container = null;
    return true;
  }
}
