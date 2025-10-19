/**
 * ARCHITECTURE: EditorInitController prepares the Correction Editor with autosave, undo, and recovery wiring.
 * It follows the manifesto by centralizing editor startup steps for a predictable, testable flow.
 * Responsibilities:
 * - Load order, restore drafts, start autosave, initialize undo snapshot, and prefetch next order.
 * - Provide a single init(orderId) returning a stabilized snapshot for the view.
 */
import { EditorAutosaveController } from "@/controllers/EditorAutosaveController";
import { EditorUndoController } from "@/controllers/EditorUndoController";
import { OrderDetailPrefetcher } from "@/services/OrderDetailPrefetcher";
import { Result } from "@/domain/Result";

export class EditorInitController {
  constructor(editorFacade, ordersQueue, autosave = null, undo = null, prefetcher = new OrderDetailPrefetcher()) {
    this.editor = editorFacade;
    this.queue = ordersQueue;
    this.autosave = autosave instanceof EditorAutosaveController ? autosave : new EditorAutosaveController(this.editor);
    this.undo = undo instanceof EditorUndoController ? undo : new EditorUndoController(this.editor);
    this.prefetcher = prefetcher;
  }

  async init(orderId) {
    const load = await this.editor.load(orderId);
    if (!load.ok) return load;
    await this.autosave.restore(orderId);
    this.autosave.start();
    this.undo.init();
    const nextId = this.queue.current() || this.queue.next();
    if (nextId) await this.prefetcher.prefetch(nextId);
    return Result.ok(this.editor.snapshot());
  }

  stop() {
    this.autosave.stop();
    return true;
  }
}
