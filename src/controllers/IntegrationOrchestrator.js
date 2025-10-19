/**
 * ARCHITECTURE: IntegrationOrchestrator wires shared controllers/services and exposes factories for views.
 * It follows the manifesto by centralizing cross-cutting instances (queue, polling, api) behind a stable API.
 * Responsibilities:
 * - Hold shared OrdersQueueService, AddressExceptionApi, and factories for WorklistFacade and EditorFacade.
 * - Provide getWorklist() and getEditor() used by views; keep instances memoized per app session.
 */
import { OrdersQueueService } from "@/services/OrdersQueueService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { WorklistFacade } from "@/controllers/WorklistFacade";
import { CorrectionEditorController } from "@/controllers/CorrectionEditorController";
import { EditorFacade } from "@/controllers/EditorFacade";
import { GoogleGeocodingAdapter } from "@/adapters/GoogleGeocodingAdapter";
import { GooglePlacesAutocompleteAdapter } from "@/adapters/GooglePlacesAutocompleteAdapter";

export class IntegrationOrchestrator {
  constructor(google, mapController) {
    this.google = google || null;
    this.mapController = mapController || null;
    this.queue = new OrdersQueueService();
    this.api = new AddressExceptionApi();
    this._worklist = null;
    this._editor = null;
  }

  getWorklist() {
    if (this._worklist) return this._worklist;
    this._worklist = new WorklistFacade(this.api, this.queue);
    return this._worklist;
  }

  getEditor() {
    if (this._editor) return this._editor;
    const geocoder = this.google ? new GoogleGeocodingAdapter(this.google) : null;
    const places = this.google ? new GooglePlacesAutocompleteAdapter(this.google) : null;
    const ctrl = new CorrectionEditorController(this.api, geocoder);
    this._editor = new EditorFacade(ctrl, this.mapController, places, this.queue);
    return this._editor;
  }
}
