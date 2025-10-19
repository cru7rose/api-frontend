/**
 * ARCHITECTURE: StatusBadgeViewModel converts processing status codes into stable badge shape for UI.
 * It follows the manifesto by separating presentation mapping from models and services.
 * Responsibilities:
 * - Map codes to {label,tone,icon} and provide a toObject() helper for templates.
 */
export class StatusBadgeViewModel {
  constructor(statusCode) {
    this.status = (statusCode || "").toUpperCase();
    this.map = {
      ADDRESS_NEEDS_REVIEW: { label: "Needs Review", tone: "warning", icon: "alert-triangle" },
      ADDRESS_VALIDATED: { label: "Validated", tone: "success", icon: "check-circle" },
      MANUALLY_CORRECTED: { label: "Corrected", tone: "success", icon: "edit-3" },
      PENDING_ADDRESS_VALIDATION: { label: "Pending", tone: "info", icon: "clock" },
      FAILED: { label: "Failed", tone: "danger", icon: "x-circle" },
    };
  }

  toObject() {
    return this.map[this.status] || { label: this.status || "Unknown", tone: "neutral", icon: "help-circle" };
  }
}
