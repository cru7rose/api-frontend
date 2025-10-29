/**
 * ARCHITECTURE: MapController coordinates a map adapter to create a map, update its marker, and recenter.
 * REFACTORED: Now supports distinct pickup/delivery markers and route drawing.
 */
export class MapController {
  constructor(mapAdapter) {
    this.adapter = mapAdapter;
    this._container = null;
    this._center = { lat: 52.2297, lon: 21.0122, zoom: 6 };
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

  // *** MODIFIED: This legacy method now controls the PICKUP marker ***
  async updateMarker(lat, lon, recenter = false) {
    return this.updatePickupMarker(lat, lon, recenter);
  }

  // *** NEW METHODS ***
  async updatePickupMarker(lat, lon, zoomTo = false) {
    if (!this._ready) throw new Error("MapController: map not initialized.");
    await this.adapter.setPickupMarker(lat, lon, zoomTo);
    if(zoomTo) this._center = { ...this._center, lat, lon };
    return true;
  }

  async updateDeliveryMarker(lat, lon, zoomTo = false) {
    if (!this._ready) throw new Error("MapController: map not initialized.");
    await this.adapter.setDeliveryMarker(lat, lon, zoomTo);
    if(zoomTo) this._center = { ...this._center, lat, lon };
    return true;
  }

  async drawRouteAndFit(pickupPos, deliveryPos) {
    if (!this._ready) throw new Error("MapController: map not initialized.");
    if (!pickupPos || !deliveryPos) return false;

    const routeDrawn = await this.adapter.drawRoute(pickupPos, deliveryPos);
    const boundsFitted = await this.adapter.fitBounds(pickupPos, deliveryPos);

    return routeDrawn && boundsFitted;
  }
  // *** END NEW METHODS ***

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