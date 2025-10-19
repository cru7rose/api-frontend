/**
 * ARCHITECTURE: KpiViewModel formats KPI values for dashboard tiles and badges.
 * It follows the manifesto by separating presentation formatting from calculation and transport.
 * Responsibilities:
 * - Hold raw numeric KPIs and expose formatted strings for UI consumption.
 */
export class KpiViewModel {
  constructor({ pending = 0, clearancePercent = 0, avgMinutes = 0 } = {}) {
    this.pending = Number(pending || 0);
    this.clearancePercent = Number(clearancePercent || 0);
    this.avgMinutes = Number(avgMinutes || 0);
  }

  pendingText() {
    return `${this.pending}`;
  }

  clearanceText() {
    if (!Number.isFinite(this.clearancePercent)) return "0.0%";
    return `${this.clearancePercent.toFixed(1)}%`;
  }

  avgResolutionText() {
    if (!Number.isFinite(this.avgMinutes)) return "—";
    if (this.avgMinutes < 60) return `${Math.round(this.avgMinutes)} min`;
    const h = Math.floor(this.avgMinutes / 60);
    const m = Math.round(this.avgMinutes % 60);
    return `${h}h ${m}m`;
  }
}
