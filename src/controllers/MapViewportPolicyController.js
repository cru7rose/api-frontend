/**
 * ARCHITECTURE: MapViewportPolicyController centralizes how the editor focuses the map on addresses.
 * It follows the manifesto by hiding viewport decisions behind a minimal, deterministic API.
 * Responsibilities:
 * - Focus on instant geocode or suggestion; update marker and optionally recenter.
 */
export class MapViewportPolicyController {
  constructor(mapController) {
    this.map = mapController;
  }

  async focusInstant(model) {
    const lat = Number(model?.latitude);
    const lon = Number(model?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    await this.map.updateMarker(lat, lon, true);
    return true;
  }

  async focusSuggestion(suggestion) {
    const lat = Number(suggestion?.latitude);
    const lon = Number(suggestion?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    await this.map.updateMarker(lat, lon, true);
    return true;
  }

  async focusAddress(addr) {
    const lat = Number(addr?.latitude);
    const lon = Number(addr?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    await this.map.updateMarker(lat, lon, true);
    return true;
  }
}
