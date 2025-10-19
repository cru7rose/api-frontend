/**
 * ARCHITECTURE: AddressExceptionApi encapsulates backend endpoints for worklist and editor operations.
 * It follows the manifesto by isolating transport, shaping payloads, and returning Result objects.
 * Responsibilities:
 * - Fetch worklist pages and order detail; submit address corrections with optional idempotency token.
 */
import api from "@/services/api";
import { Result } from "@/domain/Result";

export class AddressExceptionApi {
  constructor(basePath = "/api/address-exceptions") {
    this.basePath = basePath.replace(/\/+$/, "");
  }

  async getWorklist({ page = 1, size = 25, query = null, source = null, errorTypes = [], confidenceMin = 0, confidenceMax = 100 }) {
    try {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("size", String(size));
      if (query) q.set("query", query);
      if (source) q.set("source", source);
      if (Array.isArray(errorTypes)) errorTypes.forEach(e => q.append("errorTypes", e));
      q.set("confidenceMin", String(confidenceMin));
      q.set("confidenceMax", String(confidenceMax));
      const res = await api.get(`${this.basePath}/worklist?${q.toString()}`);
      const data = res.data || {};
      return Result.ok({
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total || 0),
      });
    } catch (e) {
      return Result.fail(e);
    }
  }

  async getOrderDetail(orderId) {
    try {
      const res = await api.get(`${this.basePath}/orders/${encodeURIComponent(orderId)}`);
      const data = res.data || {};
      return Result.ok({
        orderId: data.orderId || orderId,
        originalPickup: data.originalPickup || null,
        originalDelivery: data.originalDelivery || null,
        processingStatus: data.processingStatus || null,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      });
    } catch (e) {
      return Result.fail(e);
    }
  }

  async saveCorrection(body, idempotencyToken = null) {
    try {
      const headers = idempotencyToken ? { "Idempotency-Key": idempotencyToken } : {};
      const res = await api.post(`${this.basePath}/orders/${encodeURIComponent(body.orderId || "")}/corrections`, body, { headers });
      return Result.ok(res.data || true);
    } catch (e) {
      return Result.fail(e);
    }
  }
}
