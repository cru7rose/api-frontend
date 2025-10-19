/**
 * ARCHITECTURE: DiffPresenter formats DiffService output into UI-ready rows with labels.
 * It follows the manifesto by separating presentation decisions from diff computation.
 * Responsibilities:
 * - Map diff entries to rows; provide changed count and stable labels.
 */
export class DiffPresenter {
  constructor() {
    this.labels = {
      street: "Street",
      houseNumber: "House No.",
      postalCode: "Postal",
      city: "City",
      country: "Country",
      latitude: "Latitude",
      longitude: "Longitude",
    };
  }

  present(diffResult) {
    const entries = Array.isArray(diffResult?.entries) ? diffResult.entries : [];
    const rows = entries.map(e => ({
      field: e.field,
      label: this.labels[e.field] || e.field,
      before: e.before ?? null,
      after: e.after ?? null,
      changed: !!e.changed,
    }));
    const changed = rows.filter(r => r.changed).length;
    return { rows, changed };
  }
}
