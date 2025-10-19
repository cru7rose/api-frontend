/**
 * ARCHITECTURE: EditorDiffController computes and presents diffs for pickup and delivery addresses.
 * It follows the manifesto by composing DiffService and DiffPresenter behind a deterministic snapshot.
 * Responsibilities:
 * - Pull before/after from EditorFacade snapshot and compute UI-ready rows for both sides.
 */
import { DiffService } from "@/services/DiffService";
import { DiffPresenter } from "@/viewmodels/DiffPresenter";

export class EditorDiffController {
  constructor(editorFacade) {
    this.editor = editorFacade;
    this.diff = new DiffService();
    this.presenter = new DiffPresenter();
    this._snapshot = { pickup: { rows: [] }, delivery: { rows: [] } };
  }

  recompute() {
    const snap = this.editor.snapshot();
    const beforeP = snap.editor?.detail?.originalPickup || null;
    const afterP = snap.editor?.editedPickup || snap.editor?.editedPickup || snap.editor?.detail?.originalPickup || null;
    const beforeD = snap.editor?.detail?.originalDelivery || null;
    const afterD = snap.editor?.editedDelivery || snap.editor?.detail?.originalDelivery || null;

    const dp = this.presenter.present(this.diff.diff(beforeP, afterP));
    const dd = this.presenter.present(this.diff.diff(beforeD, afterD));

    this._snapshot = { pickup: dp, delivery: dd };
    return this._snapshot;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this._snapshot));
  }
}
