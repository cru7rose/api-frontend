/**
 * ARCHITECTURE: EditorAutosaveController persists draft edits to session and restores on load.
 * It follows the manifesto by composing EditorStateSerializer with a timed save loop.
 * Responsibilities:
 * - Save edited pickup/delivery every N ms if changed; restore when opening the same orderId.
 */
import { EditorStateSerializer } from "@/services/EditorStateSerializer";
import { AddressEqualityService } from "@/services/AddressEqualityService";

export class EditorAutosaveController {
  constructor(editorFacade, serializer = new EditorStateSerializer(), eq = new AddressEqualityService(), intervalMs = 2000) {
    this.editor = editorFacade;
    this.serializer = serializer;
    this.eq = eq;
    this.intervalMs = intervalMs;
    this._timer = null;
    this._last = null;
    this._orderId = null;
  }

  async restore(orderId) {
    this._orderId = orderId;
    const saved = this.serializer.load(orderId);
    if (saved?.editedPickup) this.editor.setManualPickup(saved.editedPickup);
    if (saved?.editedDelivery) this.editor.setManualDelivery(saved.editedDelivery);
    this._last = this._take();
    return saved || null;
  }

  start() {
    if (this._timer) return false;
    this._timer = setInterval(() => this._tick(), this.intervalMs);
    return true;
  }

  stop() {
    if (!this._timer) return false;
    clearInterval(this._timer);
    this._timer = null;
    return true;
  }

  _tick() {
    if (!this._orderId) return;
    const now = this._take();
    if (!this._equalDrafts(this._last, now)) {
      this.serializer.save(this._orderId, now);
      this._last = now;
    }
  }

  _take() {
    const s = this.editor.snapshot();
    return { editedPickup: s?.editor?.editedPickup || null, editedDelivery: s?.editor?.editedDelivery || null };
  }

  _equalDrafts(a, b) {
    return this.eq.equals(a?.editedPickup || {}, b?.editedPickup || {}) && this.eq.equals(a?.editedDelivery || {}, b?.editedDelivery || {});
  }
}
