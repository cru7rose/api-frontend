/**
 * ARCHITECTURE: IntegrationOrchestrator provides a single entrypoint to assemble worklist and editor stacks.
 * It follows the manifesto by exposing high-level factories for rapid bootstrapping in the app shell.
 * Responsibilities:
 * - Build WorklistFacade and EditorFacade instances and share session-scoped services between them.
 * - Provide a minimal API the root view can call to wire routes and screens quickly.
 */
import { WorklistFacade } from "@/controllers/WorklistFacade";
import { EditorFacade } from "@/controllers/EditorFacade";
import { OrdersQueueService } from "@/services/OrdersQueueService";
import { PollingService } from "@/services/PollingService";
import { AddressCorrectionService } from "@/services/AddressCorrectionService";
import { AddressAuditTrailService } from "@/services/AddressAuditTrailService";

export class IntegrationOrchestrator {
  constructor(googleApiKey) {
    this.googleApiKey = googleApiKey;
    this.queue = new OrdersQueueService();
    this.polling = new PollingService();
    this.audit = new AddressAuditTrailService();
    this.correction = new AddressCorrectionService(undefined, this.audit);
    this.worklist = new WorklistFacade(undefined, undefined, this.polling, this.queue);
    this.editor = new EditorFacade(this.googleApiKey, undefined, undefined, undefined, this.correction);
  }

  getWorklist() {
    return this.worklist;
  }

  getEditor() {
    return this.editor;
  }

  getAuditTrail() {
    return this.audit;
  }
}
