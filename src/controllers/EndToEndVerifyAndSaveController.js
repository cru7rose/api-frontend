/**
 * ARCHITECTURE: EndToEndVerifyAndSaveController runs normalize→validate→verify→save with telemetry.
 * It follows the manifesto by composing workflow, policy, and save flow into a single orchestrator.
 * Responsibilities:
 * - Verify pickup/delivery, apply best suggestion, and persist the result; then advance queue.
 * - Emit timing events via VerificationTelemetryController and return a concise outcome.
 */
import { AddressVerificationWorkflow } from "@/controllers/AddressVerificationWorkflow";
import { SuggestionSelectionController } from "@/controllers/SuggestionSelectionController";
import { SaveFlowController } from "@/controllers/SaveFlowController";
import { VerificationTelemetryController } from "@/controllers/VerificationTelemetryController";
import { Result } from "@/domain/Result";

export class EndToEndVerifyAndSaveController {
  constructor(googleApiKey, editorFacade, ordersQueue, saver) {
    this.workflow = new AddressVerificationWorkflow(googleApiKey);
    this.selector = new SuggestionSelectionController();
    this.saveFlow = new SaveFlowController(editorFacade, ordersQueue, saver);
    this.telemetry = new VerificationTelemetryController();
    this.editor = editorFacade;
  }

  async runForSide(side = "pickup") {
    const corr = this.telemetry.start(`e2e_${side}`);
    const addr = side === "pickup" ? this.editor.editor.editedPickup : this.editor.editor.editedDelivery;
    if (!addr) {
      this.telemetry.finish("no-input", { side });
      return Result.fail(new Error("No address to verify"));
    }
    this.telemetry.mark("verify-start", { side });
    const vr = await this.workflow.verify(addr);
    this.telemetry.mark("verify-finish", { valid: vr.success, side });
    if (!vr.success) {
      this.telemetry.finish("invalid", { side });
      return Result.fail(new Error("Validation failed"));
    }
    const best = this.selector.best(vr.normalized, vr.suggestions);
    if (best) {
      if (side === "pickup") this.editor.acceptPickupSuggestion(best.index);
      if (side === "delivery") this.editor.acceptDeliverySuggestion(best.index);
    }
    this.telemetry.mark("save-start", { side });
    const saved = await this.saveFlow.saveThenAwait(side);
    const status = saved.ok ? "ok" : "save-failed";
    this.telemetry.finish(status, { side, nextId: saved.ok ? saved.value?.nextId || null : null });
    return saved;
  }
}
