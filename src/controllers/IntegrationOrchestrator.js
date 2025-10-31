// ============================================================================
// Frontend: Update IntegrationOrchestrator (Final Version)
// FILE: src/controllers/IntegrationOrchestrator.js
// REASON: Instantiate GeocodeWithCacheController correctly.
// REASON (NEW): Fix getEditor logic to correctly create/update
//               SuggestionPreviewController when mapController is provided.
// ============================================================================
// FILE: src/controllers/IntegrationOrchestrator.js
import { OrdersQueueService } from "@/services/OrdersQueueService";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";
import { PollingService } from "@/services/PollingService";
import { WorklistFacade } from "@/controllers/WorklistFacade";
import { CorrectionEditorController } from "@/controllers/CorrectionEditorController";
import { EditorFacade } from "@/controllers/EditorFacade";
// Import GeocodeWithCacheController
import { GeocodeWithCacheController } from "@/controllers/GeocodeWithCacheController";
// *** ADDED IMPORT ***
import { SuggestionPreviewController } from "@/controllers/SuggestionPreviewController";

/**
 * ARCHITECTURE: Central factory/provider for core application controllers and services.
 * Injects dependencies like GeoRuntime and MapController to construct facades.
 * REFACTORED: Requests adapters from GeoRuntime without specifying provider type.
 * FIX: Instantiates GeocodeWithCacheController here to pass to EditorFacade.
 * FIX: getEditor now correctly creates/updates SuggestionPreviewController.
 */
export class IntegrationOrchestrator {
  constructor(geoRuntime, mapController) { // mapController might be null initially
    if (!geoRuntime) throw new Error("IntegrationOrchestrator requires a GeoRuntime instance.");
    this._geoRuntime = geoRuntime;
    this._mapController = mapController || null; // MapController instance (using configured map adapter)

    this.queue = new OrdersQueueService();
    this.api = new AddressExceptionApi();
    this.polling = new PollingService();
    this._worklist = null;
    this._editor = null;
    // Instantiate shared GeocodeWithCacheController using the provided GeoRuntime
    // This assumes GeoRuntime.init() will be called before geocodeController.geocode() is needed.
    this._geocodeController = new GeocodeWithCacheController(this._geoRuntime);
  }

  getWorklist() {
    if (this._worklist) return this._worklist;
    // Instantiate WorklistFacade on demand
    this._worklist = new WorklistFacade(this.polling);
    return this._worklist;
  }

  getEditor(mapControllerInstance = null) { // Allow passing map controller if created later
    // If an editor instance already exists, return it
    if (this._editor) {
      // *** FIX ***
      // If a new map controller is provided (e.g., editor view re-created), update it
      if (mapControllerInstance) {
        if (this._editor.preview) {
          // If preview controller exists, just update its map controller
          this._editor.preview.map = mapControllerInstance;
          this._editor.preview.policy.map = mapControllerInstance; // Also update the policy's map
        } else {
          // If preview is null (was initted with null), create it now
          this._editor.preview = new SuggestionPreviewController(mapControllerInstance);
        }
      }
      // *** END FIX ***
      return this._editor;
    }

    // Use the mapController passed during creation or the one provided now
    const effectiveMapController = mapControllerInstance || this._mapController;

    let placesAdapter = null; // Places adapter might be null if config is 'none'

    try {
      // Attempt to get the *configured* places adapter from the runtime
      // Geocoder is handled by the injected _geocodeController
      placesAdapter = this._geoRuntime.placesAdapter(); // May return null
      if(placesAdapter) {
        console.info("[IntegrationOrchestrator] Places adapter obtained for EditorFacade.");
      } else {
        console.info("[IntegrationOrchestrator] Places adapter is null/unavailable. Editor hints disabled.");
      }
    } catch(e) {
      console.error("IntegrationOrchestrator: Failed to get configured places adapter from GeoRuntime:", e.message);
      // Continue with null adapter
    }

    // Instantiate CorrectionEditorController, passing the shared GeocodeWithCacheController
    const ctrl = new CorrectionEditorController(this.api, this._geocodeController);
    // Instantiate EditorFacade, passing the relevant components
    this._editor = new EditorFacade(
        ctrl,
        effectiveMapController, // Pass the map controller instance
        placesAdapter,          // Pass potentially null places adapter
        this.queue              // Pass the orders queue
    );
    return this._editor;
  }

  // *** THIS IS THE FUNCTION THAT WAS CAUSING THE ERROR ***
  // It was missing from your file. I am adding it based on the name
  // in CorrectionEditorView.vue
  createPreviewController(mapController) {
    return new SuggestionPreviewController(mapController);
  }
}