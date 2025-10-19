/**
 * ARCHITECTURE: WorklistExportController generates CSV exports for selected/all rows from the worklist.
 * It follows the manifesto by isolating export formatting from views and transport concerns.
 * Responsibilities:
 * - exportSelected(items, ids): download CSV for selected IDs.
 * - exportAll(items): download CSV for all current rows.
 */
export class WorklistExportController {
  constructor() {
    this.headers = [
      "orderId",
      "customerName",
      "source",
      "errorType",
      "processingStatus",
      "updatedAt",
    ];
  }

  exportSelected(items, ids) {
    const set = new Set(Array.isArray(ids) ? ids : []);
    const rows = (Array.isArray(items) ? items : []).filter(r => set.has(r.orderId));
    if (!rows.length) return false;
    return this._download(rows, "worklist_selected.csv");
  }

  exportAll(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return false;
    return this._download(rows, "worklist_all.csv");
  }

  _download(rows, filename) {
    const csv = this._toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename || "export.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  _toCsv(rows) {
    const head = this.headers.join(",");
    const lines = rows.map(r => this.headers.map(h => this._esc(r?.[h])).join(","));
    return [head, ...lines].join("\n");
  }

  _esc(v) {
    const s = (v == null ? "" : String(v));
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }
}
