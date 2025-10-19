/**
 * ARCHITECTURE: DebounceTimer provides deterministic debouncing for keystroke-driven verification.
 * It follows the manifesto by encapsulating timing concerns and exposing a minimal, testable contract.
 * Responsibilities:
 * - Debounce a single async task, cancelling the previous one if a new call arrives within the interval.
 * - Prevent overlapping executions by using a monotonically increasing token.
 */
export class DebounceTimer {
  constructor(delayMs = 400) {
    this.delayMs = delayMs;
    this._timer = null;
    this._token = 0;
  }

  run(asyncFn) {
    return new Promise((resolve, reject) => {
      const current = ++this._token;
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(async () => {
        try {
          if (current !== this._token) return resolve(null);
          const r = await asyncFn();
          if (current !== this._token) return resolve(null);
          resolve(r);
        } catch (e) {
          reject(e);
        }
      }, this.delayMs);
    });
  }

  cancel() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this._token++;
  }
}
