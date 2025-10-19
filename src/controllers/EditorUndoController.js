/**
 * ARCHITECTURE: EditorUndoController wraps UndoStackService for pickup/delivery address edits.
 * It follows the manifesto by providing intent-driven methods without UI or storage coupling.
 * Responsibilities:
 * - Capture snapshots on change, and restore on undo/redo callbacks to the editor facade.
 * - Keep a tiny footprint: snapshot shape is {pickup,delivery}.
 */
import { UndoStackService } from "@/services/UndoStackService";

export class EditorUndoController {
  constructor(editorFacade, stack = new UndoStackService(100)) {
    this.editor = editorFacade;
    this.stack = stack;
  }

  init() {
    const snap = this._snapshot();
    this.stack.init(snap);
    return snap;
  }

  onChange() {
    return this.stack.push(this._snapshot());
  }

  undo() {
    const s = this.stack.undo();
    if (!s) return null;
    if (s.pickup) this.editor.setManualPickup(s.pickup);
    if (s.delivery) this.editor.setManualDelivery(s.delivery);
    return s;
  }

  redo() {
    const s = this.stack.redo();
    if (!s) return null;
    if (s.pickup) this.editor.setManualPickup(s.pickup);
    if (s.delivery) this.editor.setManualDelivery(s.delivery);
    return s;
  }

  _snapshot() {
    const st = this.editor.snapshot();
    return {
      pickup: st?.editor?.editedPickup || null,
      delivery: st?.editor?.editedDelivery || null,
    };
  }
}
