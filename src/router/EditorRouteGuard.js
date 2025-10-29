// FILE: src/router/EditorRouteGuard.js
/**
 * ARCHITECTURE: Ensures GeoRuntime is initialized and required providers are ready.
 * Supports Leaflet/Nominatim or Google stacks via configuration.
 */
export class EditorRouteGuard {
  constructor(geoRuntime) {
    if (!geoRuntime) throw new Error("EditorRouteGuard requires GeoRuntime.");
    this._geoRuntime = geoRuntime;
  }

  async canEnter(to) {
    const orderId = to?.params?.id || to?.query?.orderId || null;
    if (!orderId) throw new Error("EditorRouteGuard: orderId is required.");

    // Ensure providers are initialized before checking readiness.
    await this._geoRuntime.init();

    const cfg = this._geoRuntime._config;
    const mustBeReady = [
      ["map", cfg.map],
      ["geocode", cfg.geocode],
      ...(cfg.places && cfg.places !== "none" ? [["places", cfg.places]] : [])
    ];

    for (const [type, provider] of mustBeReady) {
      if (!this._geoRuntime.isProviderReady(type, provider)) {
        throw new Error(`EditorRouteGuard: ${type} provider '${provider}' not available.`);
      }
    }

    return true;
  }
}
