/**
 * ARCHITECTURE: WorklistFacade composes WorklistStore with polling and queue projection for the view.
 * It follows the manifesto by keeping the component thin and isolating background refresh logic.
 * Responsibilities:
 * - Load the initial page of ADDRESS_NEEDS_REVIEW items using AddressExceptionApi via WorklistStore.
 * - Start/stop timed polling that refreshes the list and synchronizes the OrdersQueueService.
 * - Expose a stable snapshot for views without leaking store internals.
 */
import { WorklistStore } from "@/stores/WorklistStore";
import { PollingService } from "@/services/PollingService";
import { Result } from "@/domain/Result";

export class WorklistFacade {
  constructor(api = null, ordersQueueService = null) {
    this.store = new WorklistStore(api);
    this.queue = ordersQueueService || { loadFromItems: () => {}, ids: () => [], current: () => null, size: () => 0 };
    this.poll = new PollingService();
  }

  async initAndLoad(filters = {}) {
    this.store.setFilterPatch(filters || {});
    const r = await this.store.loadPage();
    if (!r.ok) return r;
    this.queue.loadFromItems(this.store.items);
    return Result.ok(this.snapshot());
  }

  startPolling(intervalMs = 10000) {
    this.poll.start("worklist", intervalMs, async () => {
      const r = await this.store.loadPage();
      if (r.ok) this.queue.loadFromItems(this.store.items);
    });
    return true;
  }

  stopPolling() {
    this.poll.stop("worklist");
    return true;
  }

  snapshot() {
    return {
      store: this.store.snapshot(),
      queue: { ids: this.queue.ids(), current: this.queue.current(), size: this.queue.size() },
    };
  }
}
