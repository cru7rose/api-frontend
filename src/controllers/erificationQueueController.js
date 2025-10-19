/**
 * ARCHITECTURE: VerificationQueueController serializes geocode requests to respect provider quotas.
 * It follows the manifesto by isolating concurrency limits and exposing enqueue() with result promises.
 * Responsibilities:
 * - Maintain a FIFO queue, run up to N active tasks, and resolve/reject per item deterministically.
 * - Allow dynamic concurrency to adapt to UI load and throttle bursts from user typing.
 */
export class VerificationQueueController {
  constructor(concurrency = 2) {
    this.concurrency = Math.max(1, concurrency);
    this._active = 0;
    this._q = [];
  }

  setConcurrency(n) {
    this.concurrency = Math.max(1, n);
    this._drain();
    return this.concurrency;
  }

  enqueue(taskFn) {
    return new Promise((resolve, reject) => {
      this._q.push({ taskFn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this._active < this.concurrency && this._q.length > 0) {
      const item = this._q.shift();
      this._run(item);
    }
  }

  async _run(item) {
    this._active++;
    try {
      const r = await item.taskFn();
      item.resolve(r);
    } catch (e) {
      item.reject(e);
    } finally {
      this._active--;
      this._drain();
    }
  }

  size() {
    return this._q.length + this._active;
  }
}
