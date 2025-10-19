/**
 * ARCHITECTURE: EditorRouteGuard ensures prerequisites are met before entering the Correction Editor route.
 * It follows the manifesto by isolating cross-cutting navigation checks behind a simple guard class.
 * Responsibilities:
 * - Verify that TES provider is GOOGLE and that Google Maps JS can be loaded.
 * - Optionally validate presence of an orderId param to prevent broken editor sessions.
 */
import { ProviderGuard } from "@/controllers/ProviderGuard";
import { GoogleMapsScriptLoader } from "@/adapters/GoogleMapsScriptLoader";

export class EditorRouteGuard {
  constructor(googleApiKey) {
    this.googleApiKey = googleApiKey;
    this._provider = new ProviderGuard();
    this._loader = new GoogleMapsScriptLoader();
  }

  async canEnter(to) {
    const orderId = to?.params?.id || to?.query?.orderId || null;
    if (!orderId) throw new Error("EditorRouteGuard: orderId is required.");
    await this._provider.ensureGoogle();
    await this._loader.load(this.googleApiKey, ["places"]);
    return true;
  }
}
