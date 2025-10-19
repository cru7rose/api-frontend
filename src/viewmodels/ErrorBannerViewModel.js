/**
 * ARCHITECTURE: ErrorBannerViewModel formats technical errors into concise, user-facing banner messages.
 * It follows the manifesto by separating message mapping and ensuring deterministic display content.
 * Responsibilities:
 * - Map common categories to short titles and detailed descriptions.
 * - Provide a stable shape consumable by any banner/toast component.
 */
export class ErrorBannerViewModel {
  constructor(error) {
    this.error = error instanceof Error ? error : new Error(String(error || "Unknown error"));
    this.title = this._titleFor(this.error);
    this.detail = this._detailFor(this.error);
  }

  toObject() {
    return { title: this.title, detail: this.detail };
  }

  _titleFor(err) {
    const m = (err.message || "").toLowerCase();
    if (m.includes("network")) return "Network issue";
    if (m.includes("timeout")) return "Request timeout";
    if (m.includes("unauthorized") || m.includes("forbidden")) return "Access denied";
    if (m.includes("google")) return "Google maps error";
    return "Something went wrong";
  }

  _detailFor(err) {
    const msg = err.message || "Unexpected failure.";
    return msg.length > 180 ? msg.slice(0, 177) + "..." : msg;
  }
}
