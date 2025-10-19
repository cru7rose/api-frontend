/**
 * ARCHITECTURE: WorklistKpiController computes KPIs from the current worklist dataset.
 * It follows the manifesto by isolating KPI math from views and data transport.
 * Responsibilities:
 * - Compute pending review count, automated clearance percent, and average resolution minutes.
 * - Return a KpiViewModel ready to render in the dashboard.
 */
import { KpiViewModel } from "@/viewmodels/KpiViewModel";

export class WorklistKpiController {
  compute(items) {
    const arr = Array.isArray(items) ? items : [];

    const total = arr.length;
    const pending = arr.filter(x => (x?.processingStatus || "").toUpperCase() === "ADDRESS_NEEDS_REVIEW").length;
    const autoCleared = arr.filter(x => (x?.processingStatus || "").toUpperCase() === "ADDRESS_VALIDATED").length;

    const clearancePercent = total > 0 ? (autoCleared / total) * 100 : 0;

    const minutes = [];
    for (const r of arr) {
      const created = r?.createdAt ? new Date(r.createdAt).getTime() : null;
      const updated = r?.updatedAt ? new Date(r.updatedAt).getTime() : null;
      if (created && updated && updated >= created) {
        const diffMin = (updated - created) / 60000;
        if (Number.isFinite(diffMin)) minutes.push(diffMin);
      }
    }
    const avgMinutes = minutes.length ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0;

    return new KpiViewModel({
      pending,
      clearancePercent,
      avgMinutes,
    });
  }
}
