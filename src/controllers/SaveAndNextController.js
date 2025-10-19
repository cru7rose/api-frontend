/**
 * ARCHITECTURE: SaveAndNextController coordinates saving an address correction and loading the next order.
 * It follows the manifesto by composing persistence, queue sequencing, and editor orchestration behind one method.
 * Responsibilities:
 * - Execute a provided save function, remove current id from queue on success, and resolve the next id.
 * - Short-circuit when the queue is empty and return null for end-of-queue conditions.
 */
import { Result } from "@/domain/Result";

export class SaveAndNextController {
  constructor(ordersQueue, editorController) {
    this.queue = ordersQueue;
    this.editor = editorController;
  }

  async saveThenNext(saveFn) {
    const currentId = this.queue.current();
    if (!currentId) return Result.ok(null);
    const res = await saveFn();
    if (!res || res.ok === false) {
      const err = res?.error || new Error("Save failed.");
      return Result.fail(err);
    }
    this.queue.remove(currentId);
    const nextId = this.queue.current() || this.queue.next();
    if (!nextId) return Result.ok(null);
    const load = await this.editor.loadOrder(nextId);
    if (!load.ok) return Result.fail(load.error);
    return Result.ok(nextId);
  }
}
