/**
 * ARCHITECTURE: OrdersQueueService maintains a FIFO queue of orderIds for Save & Next workflows.
 * It follows the manifesto by isolating queue mechanics from components and views.
 * Responsibilities:
 * - Load from a list, advance to next, remove current, inspect current/size/ids.
 */
export class OrdersQueueService {
  constructor() {
    this._ids = [];
    this._index = 0;
  }

  loadFromItems(items) {
    this._ids = (Array.isArray(items) ? items : []).map(x => x.orderId).filter(Boolean);
    this._index = 0;
    return this.ids();
  }

  ids() {
    return this._ids.slice();
  }

  size() {
    return Math.max(0, this._ids.length - this._index);
  }

  current() {
    return this._ids[this._index] || null;
  }

  next() {
    if (this._index + 1 >= this._ids.length) return null;
    this._index++;
    return this.current();
  }

  remove(orderId) {
    const pos = this._ids.indexOf(orderId);
    if (pos === -1) return false;
    this._ids.splice(pos, 1);
    if (this._index > pos) this._index--;
    return true;
  }

  reset() {
    this._ids = [];
    this._index = 0;
    return true;
  }
}
