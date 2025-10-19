/**
 * ARCHITECTURE: CsvBuilder builds CSV text from arrays of objects without UI or transport coupling.
 * It follows the manifesto by providing a pure data-to-text transformation with stable escaping.
 * Responsibilities:
 * - Accept columns definition and rows; output RFC-4180-compliant CSV with quotes/escaping.
 * - Return a string for download or clipboard without side effects.
 */
export class CsvBuilder {
  constructor(columns) {
    if (!Array.isArray(columns) || columns.length === 0) throw new Error("CsvBuilder: columns are required.");
    this.columns = columns; // [{key:'orderId', title:'Order ID'}, ...]
  }

  build(rows) {
    const head = this.columns.map(c => this._q(c.title || c.key)).join(",");
    const body = (Array.isArray(rows) ? rows : []).map(r => this.columns.map(c => this._q(r[c.key])).join(",")).join("\n");
    return [head, body].filter(Boolean).join("\n");
  }

  _q(v) {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }
}
