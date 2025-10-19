/**
 * ARCHITECTURE: AppBootstrapController wires config + health + orchestrator for the app shell.
 * Responsibilities:
 * - Load env config and Google key
 * - Run health gate
 * - Build IntegrationOrchestrator stub (can be extended later with Google runtime)
 * - Return { googleKey, orchestrator, health }
 */
import { EnvironmentConfigService } from "@/services/EnvironmentConfigService";
import { HealthGateController } from "@/controllers/HealthGateController";
import { IntegrationOrchestrator } from "@/controllers/IntegrationOrchestrator";

export class AppBootstrapController {
  constructor(cfg = new EnvironmentConfigService(), health = new HealthGateController()) {
    this.cfg = cfg;
    this.healthCtrl = health;
  }

  async bootstrap() {
    await this.cfg.load();
    const googleKey = this.cfg.googleKey();
    const health = await this.healthCtrl.readiness(googleKey);
    const orchestrator = new IntegrationOrchestrator(null, null);
    return { googleKey, orchestrator, health };
  }
}
