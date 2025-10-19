/**
 * ARCHITECTURE: WorklistStore is a self-contained state holder for the Address Exception "to-do" grid.
 * It follows the manifesto by separating concerns: pure state + orchestration, no UI, no framework glue.
 * Responsibilities:
 * - Holds filter, paging, selection, rows, totals, loading/error flags.
 * - Talks to AddressExceptionApi for search, bulk preview/apply, and "next item" navigation.
 * - Exposes simple methods that views or Pinia wrappers can call without knowing API details.
 */
import { WorklistFilter } from "@/domain/WorklistFilter";
import { BulkEditPlan } from "@/domain/BulkEditPlan";
import { Result } from "@/domain/Result";
import { AddressExceptionApi } from "@/services/AddressExceptionApi";

export class WorklistStore {
  constructor(api = new AddressExceptionApi()) {
    this.api = api;
    this.filter = new WorklistFilter();
    this.items = [];
    this.total = 0;
    this.loading = false;
    this.error = null;
    this.selection = new Set();
  }

  async loadPage() {
    this.loading = true;
    this.error = null;
    this.items = [];
    const res = await this.api.searchWorklist(this.filter);
    if (!res.ok) {
      this.loading = false;
      this.error = res.error.message;
      return Result.fail(res.error);
    }
    this.items = Array.isArray(res.value.items) ? res.value.items : [];
    this.total = typeof res.value.total === "number" ? res.value.total : 0;
    this.loading = false;
    return Result.ok({ items: this.items, total: this.total });
  }

  setFilterPatch(patch) {
    this.filter = this.filter.withPatch(patch || {});
    return this.filter;
  }

  resetFilter() {
    this.filter = new WorklistFilter();
    return this.filter;
  }

  setPage(pageNumber) {
    this.filter = this.filter.withPatch({ page: pageNumber });
    return this.filter.page;
  }

  setPageSize(size) {
    this.filter = this.filter.withPatch({ pageSize: size, page: 1 });
    return this.filter.pageSize;
  }

  select(orderId) {
    if (orderId) this.selection.add(orderId);
    return this.getSelection();
  }

  unselect(orderId) {
    if (orderId) this.selection.delete(orderId);
    return this.getSelection();
  }

  clearSelection() {
    this.selection.clear();
    return this.getSelection();
  }

  getSelection() {
    return Array.from(this.selection.values());
  }

  createFindReplacePlan(field, findPattern, replaceWith) {
    return BulkEditPlan.findReplace(this.getSelection(), field, findPattern, replaceWith);
  }

  createAppendPlan(field, suffix) {
    return BulkEditPlan.append(this.getSelection(), field, suffix);
  }

  createPrependPlan(field, prefix) {
    return BulkEditPlan.prepend(this.getSelection(), field, prefix);
  }

  async bulkPreview(plan) {
    if (!(plan instanceof BulkEditPlan)) return Result.fail(new Error("Invalid BulkEditPlan."));
    const res = await this.api.bulkPreview(plan);
    if (!res.ok) return Result.fail(res.error);
    return Result.ok(res.value);
  }

  async bulkApply(plan) {
    if (!(plan instanceof BulkEditPlan)) return Result.fail(new Error("Invalid BulkEditPlan."));
    const res = await this.api.bulkApply(plan);
    if (!res.ok) return Result.fail(res.error);
    await this.loadPage();
    this.clearSelection();
    return Result.ok(res.value);
  }

  async getNextAndLoad(currentOrderId) {
    const nextIdRes = await this.api.getNextOrderId(currentOrderId, this.filter);
    if (!nextIdRes.ok) return Result.fail(nextIdRes.error);
    const nextId = nextIdRes.value || null;
    if (!nextId) return Result.ok(null);
    return Result.ok(nextId);
  }

  snapshot() {
    return {
      filter: this.filter,
      items: this.items.slice(),
      total: this.total,
      loading: this.loading,
      error: this.error,
      selection: this.getSelection(),
    };
  }
}
