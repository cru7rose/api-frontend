// ============================================================================
// Frontend: Update StatusBadgeViewModel (Supersedes previous version)
// FILE: src/viewmodels/StatusBadgeViewModel.js
// REASON: Align status map with canonical mission states (now including AWAITING_ALIAS_CHECK).
// ============================================================================
// FILE: src/viewmodels/StatusBadgeViewModel.js (Supersedes previous version)

/**
 * ARCHITECTURE: StatusBadgeViewModel converts processing status codes into stable badge shape for UI.
 * It follows the manifesto by separating presentation mapping from models and services.
 * Responsibilities:
 * - Map codes to {label,tone,icon} and provide a toObject() helper for templates.
 * UPDATED: Aligned status map with canonical mission states.
 */
export class StatusBadgeViewModel {
  constructor(statusCode) {
    this.status = (statusCode || "").toUpperCase();
    this.map = {
      // --- Canonical States ---
      INGESTED: { label: "Ingested", tone: "neutral", icon: "arrow-down-circle" },
      AWAITING_ALIAS_CHECK: { label: "Checking Alias", tone: "info", icon: "search" }, // Added
      HAPPY_PATH_MATCHED: { label: "Auto-Matched", tone: "success", icon: "check-circle" },
      PENDING_VERIFICATION: { label: "Needs Review", tone: "warning", icon: "alert-triangle" },
      APPROVED: { label: "Approved", tone: "info", icon: "check" },
      SENT_TO_TRACKIT: { label: "Sent to TrackIT", tone: "info",
        icon: "send" },
      ACK_TRACKIT: { label: "In TrackIT", tone: "success", icon: "check-circle" },
      CDC_EVENT: { label: "CDC Event", tone: "neutral", icon: "database" },
      FAILED: { label: "Failed", tone: "danger", icon: "x-circle" },

      // --- Legacy/Compatibility States (Mapped to canonical visuals where possible) ---
      ADDRESS_NEEDS_REVIEW: { label: "Needs Review", tone: "warning", icon: "alert-triangle" },
      ADDRESS_VALIDATED: { label: "Validated", tone: "success", icon: "check-circle" }, // Maps roughly to ACK_TRACKIT or HAPPY_PATH_MATCHED

      MANUALLY_CORRECTED: { label: "Corrected", tone: "info", icon: "edit-3" }, // Maps roughly to APPROVED
      PENDING_ADDRESS_VALIDATION: { label: "Pending", tone: "info", icon: "clock" }, // Maps roughly to SENT_TO_TRACKIT or AWAITING_ALIAS_CHECK
    };
  }

  toObject() {
    return this.map[this.status] || { label: this.status || "Unknown", tone: "neutral", icon: "help-circle" };
  }
}