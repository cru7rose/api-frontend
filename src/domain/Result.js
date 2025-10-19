/**
 * ARCHITEKTURA: Uniwersalny nośnik wyniku operacji (sukces/porażka) bez nulli i wyjątków sterujących przepływem.
 * Zapewnia spójny kontrakt dla wywołań usług oraz ułatwia kompozycję wyników.
 */
export class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this._value = value;
    this._error = error;
  }

  static ok(value) {
    return new Result(true, value, undefined);
  }

  static fail(error) {
    return new Result(false, undefined, error instanceof Error ? error : new Error(String(error)));
  }

  get value() {
    if (!this.ok) throw new Error("Attempt to get value from failed Result.");
    return this._value;
    }

  get error() {
    if (this.ok) throw new Error("Attempt to get error from successful Result.");
    return this._error;
  }

  map(fn) {
    return this.ok ? Result.ok(fn(this._value)) : Result.fail(this._error);
  }

  asyncMap(fn) {
    if (!this.ok) return Promise.resolve(Result.fail(this._error));
    return fn(this._value).then(Result.ok).catch(err => Result.fail(err));
  }
}
