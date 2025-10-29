// ============================================================================
// Frontend: Update WorklistFilter Domain (Supersedes previous version)
// FILE: src/domain/WorklistFilter.js
// REASON: Align default status with canonical mission state 'PENDING_VERIFICATION'.
// ============================================================================
// FILE: src/domain/WorklistFilter.js (Supersedes previous version)

/**
 * ARCHITEKTURA: Niemutowalny obiekt zapytania do listy roboczej.
 * Odpowiada za serializację filtrów do parametrów URL.
 * Separuje szczegóły filtrowania od komponentów UI oraz usług sieciowych.
 * ENHANCED: Added status, barcode, customerId, dateFrom, dateTo fields.
 * UPDATED: Changed default status to PENDING_VERIFICATION.
 */
export class WorklistFilter {
  // *** MODIFIED: Added constructor parameters and properties ***
  constructor({ status = 'PENDING_VERIFICATION', barcode = '', customerId = '', dateFrom = '', dateTo = '' } = {}) {
    this.status = status || 'PENDING_VERIFICATION'; // Default status aligned
    this.barcode = barcode || '';
    this.customerId = customerId || '';
    this.dateFrom = dateFrom || ''; // Expect YYYY-MM-DD
    this.dateTo = dateTo || '';     // Expect YYYY-MM-DD
  }
  // *** END MODIFIED ***

  withPatch(patch) {
    // *** MODIFIED: Update patch logic for new fields ***
    return new WorklistFilter({
      status: patch.status ?? this.status,
      barcode: patch.barcode ?? this.barcode,
      customerId: patch.customerId ?? this.customerId,
      dateFrom: patch.dateFrom ?? this.dateFrom,
      dateTo: patch.dateTo ?? this.dateTo,
    });
    // *** END MODIFIED ***
  }

  toQueryRecord() {
    // *** MODIFIED: Serialize all filter fields ***
    const q = {};
    if (this.status) q.status = this.status;
    if (this.barcode) q.barcode = this.barcode;
    if (this.customerId) q.customerId = this.customerId;
    if (this.dateFrom) q.dateFrom = this.dateFrom;
    if (this.dateTo) q.dateTo = this.dateTo;
    // page and size are added by the store action
    return q;
    // *** END MODIFIED ***
  }

  // Helper to return plain object state, useful for binding v-model in components
  toPlainObject() {
    return {
      status: this.status,
      barcode: this.barcode,
      customerId: this.customerId,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    };
  }
}