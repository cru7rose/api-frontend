// FILE: src/controllers/AppBootstrapController.js
// CORRECTED FILE
import { EnvironmentConfigService } from "@/services/EnvironmentConfigService";
import { HealthGateController } from "@/controllers/HealthGateController";
// import { IntegrationOrchestrator } from "@/controllers/IntegrationOrchestrator"; // REMOVED

/**
 * ARCHITECTURE: Controller responsible for initial application bootstrap steps.
 * Loads configuration, checks basic health, and prepares core services.
 * REFACTORED: Removed unnecessary placeholder creation of IntegrationOrchestrator.
 */
export class AppBootstrapController {
  constructor(
      cfg = new EnvironmentConfigService(),
      health = new HealthGateController()
  ) {
    this.cfg = cfg;
    this.healthCtrl = health;
  }

  async bootstrap() {
    const config = await this.cfg.load();

    const health = await this.healthCtrl.readiness(config?.GOOGLE_MAPS_API_KEY);

    // REMOVED: Unnecessary and failing placeholder instantiation:
    // const orchestrator = new IntegrationOrchestrator(null, null);

    return {
      config,
      health
      // REMOVED: orchestrator
    };
  }
}