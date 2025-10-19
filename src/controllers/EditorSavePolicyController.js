/**
 * ARCHITECTURE: EditorSavePolicyController decides when Save buttons should be enabled.
 * It follows the manifesto by isolating policy checks (diff, validation, geocode) from UI components.
 * Responsibilities:
 * - Evaluate readiness for pickup/delivery/both saves using diff flags and validation results.
 * - Provide explicit booleans and reasons for disabled states.
 */
export class EditorSavePolicyController {
  constructor() {
    this.requireGeocode = false;
  }

  setRequireGeocode(v) {
    this.requireGeocode = !!v;
    return this.requireGeocode;
  }

  canSavePickup(state) {
    return this._evaluate(state?.latestDiff?.pickup, state?.editor?.validation, state?.editor?.instant, "pickup");
  }

  canSaveDelivery(state) {
    return this._evaluate(state?.latestDiff?.delivery, state?.editor?.validation, state?.editor?.instant, "delivery");
  }

  canSaveBoth(state) {
    const p = this._evaluate(state?.latestDiff?.pickup, state?.editor?.validation, state?.editor?.instant, "pickup");
    const d = this._evaluate(state?.latestDiff?.delivery, state?.editor?.validation, state?.editor?.instant, "delivery");
    return { enabled: p.enabled && d.enabled, reason: p.enabled ? d.reason : p.reason };
  }

  _evaluate(diff, validation, instant, side) {
    if (!diff || !validation) return { enabled: false, reason: "No changes or validation state missing" };
    if (!diff.anyChanged) return { enabled: false, reason: "No changes detected" };
    if (!validation.valid) return { enabled: false, reason: "Invalid address fields" };
    if (this.requireGeocode && !instant) return { enabled: false, reason: "Geocode required" };
    return { enabled: true, reason: "OK" };
  }
}
