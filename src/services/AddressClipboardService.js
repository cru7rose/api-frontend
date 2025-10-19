/**
 * ARCHITECTURE: AddressClipboardService copies formatted addresses to clipboard for quick customer contact.
 * It follows the manifesto by isolating browser clipboard usage and formatting concerns.
 * Responsibilities:
 * - Build single-line and multi-line strings and write to navigator.clipboard if available.
 * - Provide deterministic return values indicating success or failure without throwing.
 */
export class AddressClipboardService {
  constructor() {
    this.available = typeof navigator !== "undefined" && !!navigator.clipboard;
  }

  async copyOneLine(a) {
    const str = this._oneLine(a);
    return this._copy(str);
  }

  async copyTwoLines(a) {
    const str = this._twoLines(a);
    return this._copy(str);
  }

  async _copy(str) {
    if (!this.available) return { ok: false, reason: "Clipboard unavailable" };
    try {
      await navigator.clipboard.writeText(str);
      return { ok: true };
    } catch (_) {
      return { ok: false, reason: "Clipboard write failed" };
    }
  }

  _oneLine(a) {
    const p1 = [a?.street, a?.houseNumber].filter(Boolean).join(" ");
    const p2 = [a?.postalCode, a?.city].filter(Boolean).join(" ");
    const p3 = a?.country || "PL";
    return [p1, p2, p3].filter(Boolean).join(", ");
  }

  _twoLines(a) {
    const p1 = [a?.street, a?.houseNumber].filter(Boolean).join(" ");
    const p2 = [a?.postalCode, a?.city, a?.country || "PL"].filter(Boolean).join(", ");
    return `${p1}\n${p2}`;
  }
}
