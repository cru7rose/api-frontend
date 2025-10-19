/**
 * ARCHITECTURE: EditorHotkeysController manages keyboard shortcuts for the Correction Editor.
 * It follows the manifesto by isolating DOM listeners and mapping keys to explicit callbacks.
 * Responsibilities:
 * - Attach/detach listeners and dispatch to provided handlers (save, save&next, accept, use original).
 * - Avoid collisions by scoping to a single active instance and ignoring repeated auto-fire.
 */
export class EditorHotkeysController {
  constructor(handlers = {}) {
    this.handlers = {
      onSave: handlers.onSave || null,
      onSaveNext: handlers.onSaveNext || null,
      onAccept: handlers.onAccept || null,
      onUseOriginal: handlers.onUseOriginal || null,
    };
    this._bound = (e) => this._onKey(e);
    this._attached = false;
  }

  attach() {
    if (this._attached) return false;
    window.addEventListener("keydown", this._bound, true);
    this._attached = true;
    return true;
  }

  detach() {
    if (!this._attached) return false;
    window.removeEventListener("keydown", this._bound, true);
    this._attached = false;
    return true;
  }

  _onKey(e) {
    if (e.repeat) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (e.shiftKey && this.handlers.onSaveNext) return this.handlers.onSaveNext();
      if (this.handlers.onSave) return this.handlers.onSave();
    }
    if (mod && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      if (this.handlers.onAccept) return this.handlers.onAccept();
    }
    if (mod && e.key.toLowerCase() === "backspace") {
      e.preventDefault();
      if (this.handlers.onUseOriginal) return this.handlers.onUseOriginal();
    }
  }
}
