// ============================================================================
// Frontend: Update EditorCommandBus
// FILE: src/controllers/EditorCommandBus.js
// REASON: FIX: Pass AddressExceptionApi to SaveFlowController, not the
//         deprecated IdempotentSaveController.
// ============================================================================
/**
 * ARCHITECTURE: EditorCommandBus maps simple UI events to complex controller actions.
 * It follows the manifesto by decoupling view components from facade/save logic.
 * REFACTORED: Instantiates SaveFlowController with AddressExceptionApi.
 */
import { SaveFlowController } from "./SaveFlowController";
import { IdempotentSaveController } from "./IdempotentSaveController";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class EditorCommandBus {
  /**
   * @param {EditorFacade} editorFacade
   * @param {SaveFlowController} saveFlow
   */
  constructor(editorFacade, saveFlow) {
    this.facade = editorFacade;
    this.saveFlow = saveFlow;
  }

  /**
   * Static factory to build the full editor stack.
   * @param {IntegrationOrchestrator} orchestrator
   * @param {WorklistStore} worklistStore
   * @param {MapController} mapController
   * @returns {EditorCommandBus}
   */
  static build(orchestrator, worklistStore, mapController) {
    const editorFacade = orchestrator.getEditor(mapController);

    // *** THIS IS THE FIX ***
    // 1. Create the API service
    const api = new AddressExceptionApi();
    // 2. Pass the API to the SaveFlowController
    const saveFlow = new SaveFlowController(editorFacade, worklistStore, api);
    // *** END FIX ***

    return new EditorCommandBus(editorFacade, saveFlow);
  }

  // --- Facade Pass-Throughs ---
  useOriginalPickup() {
    return this.facade.useOriginal("pickup");
  }
  useOriginalDelivery() {
    return this.facade.useOriginal("delivery");
  }

  // --- Save Flow Commands ---
  async savePickup(applyToSimilar = false) {
    return this.saveFlow.saveThenAwait("pickup", applyToSimilar);
  }
  async saveDelivery(applyToSimilar = false) {
    return this.saveFlow.saveThenAwait("delivery", applyToSimilar);
  }
  async saveBoth(applyToSimilar = false) {
    return this.saveFlow.saveThenAwait("both", applyToSimilar);
  }
}