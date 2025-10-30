// ============================================================================
// Frontend: Update MapViewportPolicyController.js
// FILE: src/controllers/MapViewportPolicyController.js
// REASON: Refactor methods to be side-aware (pickup vs. delivery)
//         to support showing two different markers and the route.
// ============================================================================
/**
 * ARCHITECTURE: MapViewportPolicyController centralizes how the editor focuses the map.
 * It follows the manifesto by hiding viewport decisions behind a minimal, deterministic API.
 * REFACTORED: Now accepts a 'side' parameter to control either the
 * pickup (green) or delivery (red) marker, and adds 'showAndFitRoute'.
 */
export class MapViewportPolicyController {
  constructor(mapController) {
    this.map = mapController;
  }

  /**
   * Focuses the map on an instant geocode result for a specific side.
   * @param {'pickup' | 'delivery'} side
   * @param {object} model - Address-like object with latitude/longitude.
   */
  async focusInstant(side, model) {
    return this.focusAddress(side, model);
  }

  /**
   * Focuses the map on a suggestion for a specific side.
   * @param {'pickup' | 'delivery'} side
   * @param {object} suggestion - Suggestion object with latitude/longitude.
   */
  async focusSuggestion(side, suggestion) {
    return this.focusAddress(side, suggestion);
  }

  /**
   * Updates the marker for a specific side (pickup or delivery) and
   * centers the map on it.
   * @param {'pickup' | 'delivery'} side
   * @param {object} addr - Address-like object with latitude/longitude.
   */
  async focusAddress(side, addr) {
    const lat = Number(addr?.latitude);
    const lon = Number(addr?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;

    try {
      if (side === 'pickup') {
        await this.map.updatePickupMarker(lat, lon, true); // true = recenter
      } else if (side === 'delivery') {
        await this.map.updateDeliveryMarker(lat, lon, true); // true = recenter
      } else {
        // Fallback for old calls, defaults to pickup
        await this.map.updatePickupMarker(lat, lon, true);
      }
      return true;
    } catch (e) {
      console.error(`[MapViewportPolicy] Failed to focus ${side} marker:`, e);
      return false;
    }
  }

  /**
   * Draws both pickup and delivery markers and fits the map to show the route.
   * @param {object} pickupAddr
   * @param {object} deliveryAddr
   */
  async showAndFitRoute(pickupAddr, deliveryAddr) {
    const pLat = Number(pickupAddr?.latitude);
    const pLon = Number(pickupAddr?.longitude);
    const dLat = Number(deliveryAddr?.latitude);
    const dLon = Number(deliveryAddr?.longitude);

    let pickupValid = Number.isFinite(pLat) && Number.isFinite(pLon);
    let deliveryValid = Number.isFinite(dLat) && Number.isFinite(dLon);

    try {
      // Clear any old markers/routes first
      this.map.clearAll();

      if (pickupValid) {
        await this.map.updatePickupMarker(pLat, pLon, false); // false = don't zoom
      }
      if (deliveryValid) {
        await this.map.updateDeliveryMarker(dLat, dLon, false); // false = don't zoom
      }

      // If both are valid, draw the route and fit the bounds
      if (pickupValid && deliveryValid) {
        await this.map.drawRouteAndFit(
            { lat: pLat, lon: pLon },
            { lat: dLat, lon: dLon }
        );
      }
      return true;
    } catch (e) {
      console.error(`[MapViewportPolicy] Failed to showAndFitRoute:`, e);
      return false;
    }
  }
}