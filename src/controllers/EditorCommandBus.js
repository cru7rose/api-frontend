/**
 * ARCHITECTURE: EditorCommandBus centralizes high-level editor commands for buttons and hotkeys.
 * It follows the manifesto by exposing intent methods that orchestrate other controllers/facades.
 * Responsibilities:
 * - Provide accept/use-original/save/save&next commands for pickup, delivery, and both.
 * - Keep a single place to wire UI actions to EditorFacade and SaveFlowController.
 */
import { Result } from "@/domain/Result";

export class EditorCommandBus {
  constructor(editorFacade, saveFlowController) {
    this.editor = editorFacade;
    this.saveFlow = saveFlowController;
  }

  acceptPickup(i = 0) {
    const r = this.editor.acceptPickupSuggestion(i);
    return r.ok ? Result.ok(true) : r;
  }

  acceptDelivery(i = 0) {
    const r = this.editor.acceptDeliverySuggestion(i);
    return r.ok ? Result.ok(true) : r;
  }

  useOriginalPickup() {
    const r = this.editor.useOriginalPickup();
    return r.ok ? Result.ok(true) : r;
  }

  useOriginalDelivery() {
    const r = this.editor.useOriginalDelivery();
    return r.ok ? Result.ok(true) : r;
  }

  async savePickupThenNext() {
    return this.saveFlow.saveThenAwait("pickup");
  }

  async saveDeliveryThenNext() {
    return this.saveFlow.saveThenAwait("delivery");
  }

  async saveBothThenNext() {
    return this.saveFlow.saveThenAwait("both");
  }
}
